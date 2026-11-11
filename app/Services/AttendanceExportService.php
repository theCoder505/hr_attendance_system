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
     * Export attendance records for all, a specific employee, or a specific outlet as an XLSX download.
     */
    public function exportToExcel(?int $employeeId = null, ?int $outletId = null, ?int $adminId = null, ?int $month = null, ?int $year = null): StreamedResponse
    {
        $query = Attendance::with(['employee', 'outlet'])->orderBy('date', 'desc');

        if ($adminId) {
            $query->where('admin_id', $adminId);
        }

        $periodSuffix = '';
        if ($month && $year) {
            $startOfMonth = Carbon::createFromDate($year, $month, 1)->startOfMonth()->toDateString();
            $endOfMonth = Carbon::createFromDate($year, $month, 1)->endOfMonth()->toDateString();
            $query->whereBetween('date', [$startOfMonth, $endOfMonth]);
            $periodSuffix = "_{$year}_" . str_pad($month, 2, '0', STR_PAD_LEFT);
        }

        $filename = "Attendance_Export_All{$periodSuffix}_" . date('Y-m-d_His') . '.xlsx';

        if ($outletId) {
            $query->where('outlet_id', $outletId);
            $outlet = Outlet::find($outletId);
            if ($outlet) {
                $safeOutlet = preg_replace('/[^A-Za-z0-9_\-]/', '_', $outlet->name);
                $filename = "Attendance_Export_Outlet_{$safeOutlet}{$periodSuffix}_" . date('Y-m-d_His') . '.xlsx';
            }
        }

        if ($employeeId) {
            $query->where('employee_id', $employeeId);
            $emp = Employee::find($employeeId);
            if ($emp) {
                $safeName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $emp->name);
                $filename = "Attendance_Export_{$safeName}{$periodSuffix}_" . date('Y-m-d_His') . '.xlsx';
            }
        }

        $attendances = $query->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Attendance Log');

        // Headers
        $headers = [
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

        foreach ($headers as $cell => $value) {
            $sheet->setCellValue($cell, $value);
        }

        // Style Header
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
        $sheet->getStyle('A1:N1')->applyFromArray($headerStyle);
        $sheet->getRowDimension(1)->setRowHeight(28);

        $row = 2;
        $totalLate = 0;
        $totalEarly = 0;
        $totalOvertime = 0;

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

            $sheet->setCellValue("A{$row}", $index + 1);
            $sheet->setCellValue("B{$row}", $outletName);
            $sheet->setCellValue("C{$row}", $item->employee->uid ?? 'N/A');
            $sheet->setCellValue("D{$row}", $item->employee->name ?? 'Deleted');
            $sheet->setCellValue("E{$row}", $item->employee->role ?? 'N/A');
            $sheet->setCellValue("F{$row}", date('Y-m-d', strtotime($item->date)));
            $sheet->setCellValue("G{$row}", $checkIn);
            $sheet->setCellValue("H{$row}", $checkOut);
            $sheet->setCellValue("I{$row}", $workHoursText);
            $sheet->setCellValue("J{$row}", (int) $item->late_minutes);
            $sheet->setCellValue("K{$row}", (int) $item->early_leave_minutes);
            $sheet->setCellValue("L{$row}", (int) $item->overtime_minutes);
            $sheet->setCellValue("M{$row}", $item->is_manual ? 'Manual' : 'System');
            $sheet->setCellValue("N{$row}", $statusText);

            $totalLate += (int) $item->late_minutes;
            $totalEarly += (int) $item->early_leave_minutes;
            $totalOvertime += (int) $item->overtime_minutes;

            $sheet->getRowDimension($row)->setRowHeight(22);
            $row++;
        }

        // Summary Row for Attendance Log
        $summaryRow = $row;
        $sheet->setCellValue("A{$summaryRow}", 'TOTAL');
        $sheet->mergeCells("A{$summaryRow}:H{$summaryRow}");
        $sheet->setCellValue("J{$summaryRow}", $totalLate);
        $sheet->setCellValue("K{$summaryRow}", $totalEarly);
        $sheet->setCellValue("L{$summaryRow}", $totalOvertime);

        $summaryStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => '0F172A']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'F1F5F9'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ];
        $sheet->getStyle("A{$summaryRow}:N{$summaryRow}")->applyFromArray($summaryStyle);

        // Apply borders and auto column width
        $lastRow = $summaryRow;
        $sheet->getStyle("A1:N{$lastRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setRGB('CBD5E1');

        foreach (range('A', 'N') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Add Monthly Performance Summary Sheet if month and year are specified
        if ($month && $year && $adminId) {
            $admin = Admin::find($adminId);
            if ($admin) {
                $daysInMonth = Carbon::createFromDate($year, $month, 1)->daysInMonth;
                $empQuery = $admin->employees()->with('outlet')->orderBy('name');
                if ($outletId) {
                    $empQuery->where('outlet_id', $outletId);
                }
                if ($employeeId) {
                    $empQuery->where('id', $employeeId);
                }
                $employeesList = $empQuery->get();

                $summarySheet = $spreadsheet->createSheet();
                $summarySheet->setTitle('Monthly Summary');

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

                $attendancesByEmp = $attendances->groupBy('employee_id');
                $sRow = 2;

                foreach ($employeesList as $sIndex => $emp) {
                    $empRecords = $attendancesByEmp->get($emp->id, collect());
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

                    // Calculate scheduled work days in this month excluding weekends
                    $empWorkDays = $emp->working_days;
                    if (empty($empWorkDays) || ! is_array($empWorkDays)) {
                        $empWorkDays = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu'];
                    }
                    $empWorkDays = array_map('strtolower', $empWorkDays);

                    $scheduledDaysCount = 0;
                    for ($d = 1; $d <= $daysInMonth; $d++) {
                        $dObj = Carbon::createFromDate($year, $month, $d);
                        $dShort = strtolower($dObj->format('D'));
                        if (in_array($dShort, $empWorkDays, true)) {
                            $scheduledDaysCount++;
                        }
                    }

                    $dailyHours = (float) ($emp->working_hours ?? 8);
                    $scheduledTotalHours = $scheduledDaysCount * $dailyHours;

                    $actualH = floor($actualMins / 60);
                    $actualM = $actualMins % 60;
                    $schedFormatted = (fmod($scheduledTotalHours, 1.0) == 0.0) ? (int) $scheduledTotalHours : $scheduledTotalHours;
                    $workHoursRatio = sprintf('%d.%02d/%s', $actualH, $actualM, $schedFormatted);

                    $lateRecs = $empRecords->where('late_minutes', '>', 0);
                    $earlyRecs = $empRecords->where('early_leave_minutes', '>', 0);
                    $otRecs = $empRecords->where('overtime_minutes', '>', 0);

                    $summarySheet->setCellValue("A{$sRow}", $sIndex + 1);
                    $summarySheet->setCellValue("B{$sRow}", $emp->uid);
                    $summarySheet->setCellValue("C{$sRow}", $emp->name);
                    $summarySheet->setCellValue("D{$sRow}", $emp->role);
                    $summarySheet->setCellValue("E{$sRow}", $emp->outlet?->name ?? 'Default');
                    $summarySheet->setCellValue("F{$sRow}", $presentDays);
                    $summarySheet->setCellValue("G{$sRow}", $scheduledDaysCount);
                    $summarySheet->setCellValue("H{$sRow}", $workHoursRatio);
                    $summarySheet->setCellValue("I{$sRow}", $lateRecs->count());
                    $summarySheet->setCellValue("J{$sRow}", (int) $lateRecs->sum('late_minutes'));
                    $summarySheet->setCellValue("K{$sRow}", $earlyRecs->count());
                    $summarySheet->setCellValue("L{$sRow}", (int) $earlyRecs->sum('early_leave_minutes'));
                    $summarySheet->setCellValue("M{$sRow}", $otRecs->count());
                    $summarySheet->setCellValue("N{$sRow}", (int) $otRecs->sum('overtime_minutes'));

                    $summarySheet->getRowDimension($sRow)->setRowHeight(22);
                    $sRow++;
                }

                $summarySheet->getStyle("A1:N" . ($sRow - 1))->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setRGB('CBD5E1');

                foreach (range('A', 'N') as $col) {
                    $summarySheet->getColumnDimension($col)->setAutoSize(true);
                }
            }
        }

        // Set the active sheet index to the first sheet before saving
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
