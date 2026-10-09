<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Outlet;
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
    public function exportToExcel(?int $employeeId = null, ?int $outletId = null): StreamedResponse
    {
        $query = Attendance::with(['employee', 'outlet'])->orderBy('date', 'desc');

        $filename = 'Attendance_Export_All_' . date('Y-m-d_His') . '.xlsx';

        if ($outletId) {
            $query->where('outlet_id', $outletId);
            $outlet = Outlet::find($outletId);
            if ($outlet) {
                $safeOutlet = preg_replace('/[^A-Za-z0-9_\-]/', '_', $outlet->name);
                $filename = "Attendance_Export_Outlet_{$safeOutlet}_" . date('Y-m-d_His') . '.xlsx';
            }
        }

        if ($employeeId) {
            $query->where('employee_id', $employeeId);
            $emp = Employee::find($employeeId);
            if ($emp) {
                $safeName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $emp->name);
                $filename = "Attendance_Export_{$safeName}_" . date('Y-m-d_His') . '.xlsx';
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
            'I1' => 'Late (Min)',
            'J1' => 'Early Leave (Min)',
            'K1' => 'Overtime (Min)',
            'L1' => 'Entry Type',
            'M1' => 'Status',
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
        $sheet->getStyle('A1:M1')->applyFromArray($headerStyle);
        $sheet->getRowDimension(1)->setRowHeight(28);

        $row = 2;
        $totalLate = 0;
        $totalEarly = 0;
        $totalOvertime = 0;

        foreach ($attendances as $index => $item) {
            $checkIn = $item->check_in_at ? date('h:i A', strtotime($item->check_in_at)) : 'N/A';
            $checkOut = $item->check_out_at ? date('h:i A', strtotime($item->check_out_at)) : 'Pending';

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
            $sheet->setCellValue("I{$row}", (int) $item->late_minutes);
            $sheet->setCellValue("J{$row}", (int) $item->early_leave_minutes);
            $sheet->setCellValue("K{$row}", (int) $item->overtime_minutes);
            $sheet->setCellValue("L{$row}", $item->is_manual ? 'Manual' : 'System');
            $sheet->setCellValue("M{$row}", $statusText);

            $totalLate += (int) $item->late_minutes;
            $totalEarly += (int) $item->early_leave_minutes;
            $totalOvertime += (int) $item->overtime_minutes;

            $sheet->getRowDimension($row)->setRowHeight(22);
            $row++;
        }

        // Summary Row
        $summaryRow = $row;
        $sheet->setCellValue("A{$summaryRow}", 'TOTAL');
        $sheet->mergeCells("A{$summaryRow}:H{$summaryRow}");
        $sheet->setCellValue("I{$summaryRow}", $totalLate);
        $sheet->setCellValue("J{$summaryRow}", $totalEarly);
        $sheet->setCellValue("K{$summaryRow}", $totalOvertime);

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
        $sheet->getStyle("A{$summaryRow}:M{$summaryRow}")->applyFromArray($summaryStyle);

        // Apply borders and auto column width
        $lastRow = $summaryRow;
        $sheet->getStyle("A1:M{$lastRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setRGB('CBD5E1');

        foreach (range('A', 'M') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

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
