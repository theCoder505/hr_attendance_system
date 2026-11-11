<?php

namespace App\Services;

use App\Models\Admin;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Outlet;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttendanceExportService
{
    /**
     * Export attendance records and monthly performance summary as an XLSX download.
     */
    public function exportToExcel(?int $employeeId = null, ?int $outletId = null, ?int $adminId = null, ?int $month = null, ?int $year = null): StreamedResponse
    {
        $appTimezone = config('app.timezone', 'Asia/Dhaka');
        $now = Carbon::now($appTimezone);
        $month = $month ?: (int) $now->month;
        $year = $year ?: (int) $now->year;

        $startOfMonth = Carbon::createFromDate($year, $month, 1, $appTimezone)->startOfMonth();
        $endOfMonth = $startOfMonth->copy()->endOfMonth();
        $daysInMonth = $startOfMonth->daysInMonth;

        $query = Attendance::with(['employee', 'outlet'])
            ->whereBetween('date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
            ->orderBy('date', 'desc');

        if ($adminId) {
            $query->where('admin_id', $adminId);
        }

        $periodSuffix = "_{$year}_".str_pad($month, 2, '0', STR_PAD_LEFT);
        $filename = "Attendance_Report_All{$periodSuffix}_".date('Y-m-d_His').'.xlsx';

        if ($outletId) {
            $query->where('outlet_id', $outletId);
            $outlet = Outlet::find($outletId);
            if ($outlet) {
                $safeOutlet = preg_replace('/[^A-Za-z0-9_\-]/', '_', $outlet->name);
                $filename = "Attendance_Report_Outlet_{$safeOutlet}{$periodSuffix}_".date('Y-m-d_His').'.xlsx';
            }
        }

        if ($employeeId) {
            $query->where('employee_id', $employeeId);
            $emp = Employee::find($employeeId);
            if ($emp) {
                $safeName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $emp->name);
                $filename = "Attendance_Report_{$safeName}{$periodSuffix}_".date('Y-m-d_His').'.xlsx';
            }
        }

        $attendances = $query->get();

        $spreadsheet = new Spreadsheet;

        // -------------------------------------------------------------
        // SHEET 1: Monthly Summary (Primary Sheet matching Reports page)
        // -------------------------------------------------------------
        $summarySheet = $spreadsheet->getActiveSheet();
        $summarySheet->setTitle('Monthly Summary');

        $headerStyle = [
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 11,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '1E293B'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ];

        $summaryHeaders = [
            'A1' => 'SL',
            'B1' => 'Employee UID',
            'C1' => 'Employee Name',
            'D1' => 'Role',
            'E1' => 'Outlet',
            'F1' => 'Present Days',
            'G1' => 'Work Days (Month)',
            'H1' => 'Work Hours',
            'I1' => 'Late Times',
            'J1' => 'Total Late (Min)',
            'K1' => 'Early Leave Times',
            'L1' => 'Total Early Leave (Min)',
            'M1' => 'Overtime Times',
            'N1' => 'Total Overtime (Min)',
        ];

        foreach ($summaryHeaders as $cell => $val) {
            $summarySheet->setCellValue($cell, $val);
        }
        $summarySheet->getStyle('A1:N1')->applyFromArray($headerStyle);
        $summarySheet->getRowDimension(1)->setRowHeight(28);

        // Fetch employees for summary
        $employeesList = collect();
        if ($adminId) {
            $admin = Admin::find($adminId);
            if ($admin) {
                $empQuery = $admin->employees()->with('outlet')->orderBy('name');
                if ($outletId) {
                    $empQuery->where('outlet_id', $outletId);
                }
                if ($employeeId) {
                    $empQuery->where('id', $employeeId);
                }
                $employeesList = $empQuery->get();
            }
        }

        $attendancesByEmp = $attendances->groupBy('employee_id');
        $sRow = 2;

        foreach ($employeesList as $sIndex => $employee) {
            $empRecords = $attendancesByEmp->get($employee->id, collect());
            $presentDays = $empRecords->count();

            // Calculate actual worked minutes
            $actualMins = 0;
            foreach ($empRecords as $r) {
                if ($r->check_in_at && $r->check_out_at) {
                    $cIn = Carbon::parse($r->check_in_at);
                    $cOut = Carbon::parse($r->check_out_at);
                    $actualMins += max(0, $cIn->diffInMinutes($cOut));
                }
            }

            // Calculate scheduled work days in this month excluding employee's weekends
            $empWorkDays = $employee->working_days;
            if (empty($empWorkDays) || ! is_array($empWorkDays)) {
                $empWorkDays = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu'];
            }
            $empWorkDays = array_map('strtolower', $empWorkDays);

            $scheduledDaysCount = 0;
            for ($d = 1; $d <= $daysInMonth; $d++) {
                $dObj = Carbon::createFromDate($year, $month, $d, $appTimezone);
                $dShort = strtolower($dObj->format('D'));
                if (in_array($dShort, $empWorkDays, true)) {
                    $scheduledDaysCount++;
                }
            }

            $dailyHours = (float) ($employee->working_hours ?? 8);
            $scheduledTotalHours = $scheduledDaysCount * $dailyHours;

            $actualH = floor($actualMins / 60);
            $actualM = $actualMins % 60;
            $schedFormatted = (fmod($scheduledTotalHours, 1.0) == 0.0) ? (int) $scheduledTotalHours : $scheduledTotalHours;
            // Exact format e.g. 7.30/8 or 160.30/176
            $workHoursRatio = sprintf('%d.%02d/%s', $actualH, $actualM, $schedFormatted);

            $lateRecs = $empRecords->where('late_minutes', '>', 0);
            $earlyRecs = $empRecords->where('early_leave_minutes', '>', 0);
            $otRecs = $empRecords->where('overtime_minutes', '>', 0);

            $lateMins = (int) $lateRecs->sum('late_minutes');
            $earlyMins = (int) $earlyRecs->sum('early_leave_minutes');
            $otMins = (int) $otRecs->sum('overtime_minutes');

            $summarySheet->setCellValue("A{$sRow}", $sIndex + 1);
            $summarySheet->setCellValue("B{$sRow}", $employee->uid);
            $summarySheet->setCellValue("C{$sRow}", $employee->name);
            $summarySheet->setCellValue("D{$sRow}", $employee->role);
            $summarySheet->setCellValue("E{$sRow}", $employee->outlet?->name ?? 'Default');
            $summarySheet->setCellValue("F{$sRow}", $presentDays);
            $summarySheet->setCellValue("G{$sRow}", $scheduledDaysCount);
            $summarySheet->setCellValue("H{$sRow}", $workHoursRatio);
            $summarySheet->setCellValue("I{$sRow}", $lateRecs->count());
            $summarySheet->setCellValue("J{$sRow}", $lateMins);
            $summarySheet->setCellValue("K{$sRow}", $earlyRecs->count());
            $summarySheet->setCellValue("L{$sRow}", $earlyMins);
            $summarySheet->setCellValue("M{$sRow}", $otRecs->count());
            $summarySheet->setCellValue("N{$sRow}", $otMins);

            $summarySheet->getRowDimension($sRow)->setRowHeight(22);
            $sRow++;
        }

        $lastSummaryRow = max(1, $sRow - 1);
        $summarySheet->getStyle("A1:N{$lastSummaryRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setRGB('CBD5E1');

        foreach (range('A', 'N') as $col) {
            $summarySheet->getColumnDimension($col)->setAutoSize(true);
        }

        // -------------------------------------------------------------
        // SHEET 2: Detailed Daily Attendance Logs
        // -------------------------------------------------------------
        $logSheet = $spreadsheet->createSheet();
        $logSheet->setTitle('Attendance Logs');

        $logHeaders = [
            'A1' => 'SL',
            'B1' => 'Outlet',
            'C1' => 'Employee UID',
            'D1' => 'Employee Name',
            'E1' => 'Role',
            'F1' => 'Date',
            'G1' => 'Check In',
            'H1' => 'Check Out',
            'I1' => 'Work Hours',
            'J1' => 'Late (Min)',
            'K1' => 'Early Leave (Min)',
            'L1' => 'Overtime (Min)',
            'M1' => 'Entry Type',
            'N1' => 'Status',
        ];

        foreach ($logHeaders as $cell => $value) {
            $logSheet->setCellValue($cell, $value);
        }
        $logSheet->getStyle('A1:N1')->applyFromArray($headerStyle);
        $logSheet->getRowDimension(1)->setRowHeight(28);

        $lRow = 2;

        foreach ($attendances as $index => $item) {
            $checkIn = $item->check_in_at ? date('h:i A', strtotime($item->check_in_at)) : 'N/A';
            $checkOut = $item->check_out_at ? date('h:i A', strtotime($item->check_out_at)) : 'Pending';

            $workHoursText = '—';
            if ($item->check_in_at && $item->check_out_at) {
                $cIn = Carbon::parse($item->check_in_at);
                $cOut = Carbon::parse($item->check_out_at);
                $workedMins = max(0, $cIn->diffInMinutes($cOut));
                $h = floor($workedMins / 60);
                $m = $workedMins % 60;
                $target = (float) ($item->employee?->working_hours ?? 8);
                $targetFormatted = (fmod($target, 1.0) == 0.0) ? (int) $target : $target;
                $workHoursText = sprintf('%d.%02d/%s', $h, $m, $targetFormatted);
            } elseif ($item->check_in_at) {
                $cIn = Carbon::parse($item->check_in_at);
                $currentMins = max(0, Carbon::now()->diffInMinutes($cIn));
                $h = floor($currentMins / 60);
                $m = $currentMins % 60;
                $target = (float) ($item->employee?->working_hours ?? 8);
                $targetFormatted = (fmod($target, 1.0) == 0.0) ? (int) $target : $target;
                $workHoursText = sprintf('%d.%02d/%s (In Progress)', $h, $m, $targetFormatted);
            }

            $statusText = 'Present';
            if ($item->late_minutes > 0) {
                $statusText .= ' (Late)';
            }
            if ($item->early_leave_minutes > 0) {
                $statusText .= ' (Early Leave)';
            }

            $outletName = $item->outlet?->name ?? ($item->employee?->outlet?->name ?? 'Default');

            $logSheet->setCellValue("A{$lRow}", $index + 1);
            $logSheet->setCellValue("B{$lRow}", $outletName);
            $logSheet->setCellValue("C{$lRow}", $item->employee->uid ?? 'N/A');
            $logSheet->setCellValue("D{$lRow}", $item->employee->name ?? 'Deleted');
            $logSheet->setCellValue("E{$lRow}", $item->employee->role ?? 'N/A');
            $logSheet->setCellValue("F{$lRow}", date('Y-m-d', strtotime($item->date)));
            $logSheet->setCellValue("G{$lRow}", $checkIn);
            $logSheet->setCellValue("H{$lRow}", $checkOut);
            $logSheet->setCellValue("I{$lRow}", $workHoursText);
            $logSheet->setCellValue("J{$lRow}", (int) $item->late_minutes);
            $logSheet->setCellValue("K{$lRow}", (int) $item->early_leave_minutes);
            $logSheet->setCellValue("L{$lRow}", (int) $item->overtime_minutes);
            $logSheet->setCellValue("M{$lRow}", $item->is_manual ? 'Manual' : 'System');
            $logSheet->setCellValue("N{$lRow}", $statusText);

            $logSheet->getRowDimension($lRow)->setRowHeight(22);
            $lRow++;
        }

        $lastLogRow = max(1, $lRow - 1);
        $logSheet->getStyle("A1:N{$lastLogRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setRGB('CBD5E1');

        foreach (range('A', 'N') as $col) {
            $logSheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Set the active sheet index to the first sheet (Monthly Summary)
        $spreadsheet->setActiveSheetIndex(0);

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control' => 'max-age=0',
        ]);
    }
}
