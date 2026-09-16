from django.db import models


class Attendance(models.Model):
    """
    Daily employee attendance tracking.
    Records time-in, time-out, and attendance status.
    """
    employee = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.CASCADE,
        related_name='attendance_records',
        verbose_name='Employee'
    )
    date = models.DateField(verbose_name='Date')
    time_in = models.TimeField(blank=True, null=True, verbose_name='Time In')
    time_out = models.TimeField(blank=True, null=True, verbose_name='Time Out')
    status = models.CharField(
        max_length=20,
        choices=[
            ('present', 'Present'),
            ('absent', 'Absent'),
            ('late', 'Late'),
            ('half_day', 'Half Day'),
            ('on_leave', 'On Leave'),
            ('weekend', 'Weekend'),
            ('holiday', 'Public Holiday')
        ],
        default='present',
        verbose_name='Status'
    )
    total_hours = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Total Hours Worked'
    )
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hr_attendance'
        verbose_name = 'Attendance Record'
        verbose_name_plural = 'Attendance Records'
        ordering = ['-date', 'employee']
        unique_together = [['employee', 'date']]
        indexes = [
            models.Index(fields=['employee', 'date']),
            models.Index(fields=['date', 'status']),
        ]

    def __str__(self):
        return f"{self.employee.get_full_name()} - {self.date} ({self.status})"

    def save(self, *args, **kwargs):
        """Auto-calculate total hours if both time_in and time_out are provided"""
        if self.time_in and self.time_out:
            from datetime import datetime, timedelta
            time_in_dt = datetime.combine(self.date, self.time_in)
            time_out_dt = datetime.combine(self.date, self.time_out)
            if time_out_dt < time_in_dt:
                time_out_dt += timedelta(days=1)
            duration = time_out_dt - time_in_dt
            self.total_hours = duration.total_seconds() / 3600
        super().save(*args, **kwargs)
