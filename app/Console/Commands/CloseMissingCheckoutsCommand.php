<?php

namespace App\Console\Commands;

use App\Services\AttendanceService;
use Illuminate\Console\Command;

class CloseMissingCheckoutsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'attendance:close-missing-checkouts';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically close unclosed attendance records as early leave once the next check-in window begins.';

    /**
     * Execute the console command.
     */
    public function handle(AttendanceService $attendanceService): int
    {
        $this->info('Scanning for open attendance records past their check-in window...');

        $closed = $attendanceService->autoCloseAllMissingCheckouts();

        $this->info("Successfully closed {$closed} missing checkout attendance record(s).");

        return Command::SUCCESS;
    }
}
