<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Employee;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttendanceExportService
{
    /**
     * Export attendance records for all or a specific employee as an XLSX download.
     */
    public function exportToExcel(?int $employeeId = null): StreamedResponse
    {
        $query = Attendance::with('employee')->orderBy('date', 'desc');

        $filename = 'Attendance_Export_All_' . date('Y-m-d_His') . '.xlsx';

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
            'B1' => 'Employee UID',
            'C1' => 'Employee Name',
            'D1' => 'Role',
            'E1' => 'Date',
            'F1' => 'Check In',
            'G1' => 'Check Out',
            'H1' => 'Late (Min)',
            'I1' => 'Early Leave (Min)',
            'J1' => 'Overtime (Min)',
            'K1' => 'Entry Type',
            'L1' => 'Status',
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
        $sheet->getStyle('A1:L1')->applyFromArray($headerStyle);
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

            $sheet->setCellValue("A{$row}", $index + 1);
            $sheet->setCellValue("B{$row}", $item->employee->uid ?? 'N/A');
            $sheet->setCellValue("C{$row}", $item->employee->name ?? 'Deleted');
            $sheet->setCellValue("D{$row}", $item->employee->role ?? 'N/A');
            $sheet->setCellValue("E{$row}", date('Y-m-d', strtotime($item->date)));
            $sheet->setCellValue("F{$row}", $checkIn);
            $sheet->setCellValue("G{$row}", $checkOut);
            $sheet->setCellValue("H{$row}", (int) $item->late_minutes);
            $sheet->setCellValue("I{$row}", (int) $item->early_leave_minutes);
            $sheet->setCellValue("J{$row}", (int) $item->overtime_minutes);
            $sheet->setCellValue("K{$row}", $item->is_manual ? 'Manual' : 'System');
            $sheet->setCellValue("L{$row}", $statusText);

            $totalLate += (int) $item->late_minutes;
            $totalEarly += (int) $item->early_leave_minutes;
            $totalOvertime += (int) $item->overtime_minutes;

            $sheet->getRowDimension($row)->setRowHeight(22);
            $row++;
        }

        // Summary Row
        $summaryRow = $row;
        $sheet->setCellValue("A{$summaryRow}", 'TOTAL');
        $sheet->mergeCells("A{$summaryRow}:G{$summaryRow}");
        $sheet->setCellValue("H{$summaryRow}", $totalLate);
        $sheet->setCellValue("I{$summaryRow}", $totalEarly);
        $sheet->setCellValue("J{$summaryRow}", $totalOvertime);

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
        $sheet->getStyle("A{$summaryRow}:L{$summaryRow}")->applyFromArray($summaryStyle);

        // Apply borders and auto column width
        $lastRow = $summaryRow;
        $sheet->getStyle("A1:L{$lastRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setRGB('CBD5E1');

        foreach (range('A', 'L') as $col) {
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
