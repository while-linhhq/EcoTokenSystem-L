import { useState, useMemo } from 'react';
import './Calendar.css';

const Calendar = ({ approvedDates = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Bước 3: Tính toán và hiển thị dựa trên thông tin ngày giờ
  // Convert approved dates to Set for quick lookup (format: YYYY-MM-DD)
  // Xử lý timezone: Backend trả về UTC, cần convert về local time để hiển thị đúng ngày
  const approvedDatesSet = useMemo(() => {
    const dateSet = new Set();
    
    approvedDates.forEach((date) => {
      try {
        if (!date) {
          return;
        }
        
        // Parse date từ backend (ISO string với UTC timezone)
        const d = new Date(date);
        if (isNaN(d.getTime())) {
          return;
        }
        
        // Convert UTC date về local date để hiển thị đúng ngày theo timezone của user
        // Lấy năm, tháng, ngày từ local time (không phải UTC)
        const year = d.getFullYear();
        const month = d.getMonth();
        const day = d.getDate();
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        dateSet.add(dateStr);
      } catch (error) {
        // Silent fail - chỉ log error nếu cần debug
      }
    });
    
    return dateSet;
  }, [approvedDates]);

  // Tính số ngày đã được duyệt trong tháng hiện tại
  const approvedCountInCurrentMonth = useMemo(() => {
    const currentMonthYear = `${year}-${String(month + 1).padStart(2, '0')}`;
    return Array.from(approvedDatesSet).filter(dateStr => {
      return dateStr.startsWith(currentMonthYear);
    }).length;
  }, [approvedDatesSet, year, month]);

  const isDateApproved = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return approvedDatesSet.has(dateStr);
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  // Create calendar grid
  const calendarDays = [];
  
  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h3>📅 Lịch sống xanh</h3>
        <p className="calendar-subtitle">
          {approvedCountInCurrentMonth} ngày đã được duyệt trong tháng này
        </p>
      </div>

      <div className="calendar-controls">
        <button onClick={goToPreviousMonth} className="calendar-nav-btn">
          ‹
        </button>
        <div className="calendar-month-year">
          <span>{monthNames[month]} {year}</span>
          <button onClick={goToToday} className="today-btn">Hôm nay</button>
        </div>
        <button onClick={goToNextMonth} className="calendar-nav-btn">
          ›
        </button>
      </div>

      <div className="calendar-grid">
        {/* Day names header */}
        {dayNames.map((dayName, index) => (
          <div key={index} className="calendar-day-name">
            {dayName}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={index} className="calendar-day empty"></div>;
          }

          const approved = isDateApproved(day);
          const today = isToday(day);

          return (
            <div
              key={index}
              className={`calendar-day ${approved ? 'approved' : ''} ${today ? 'today' : ''}`}
              title={approved ? `Ngày ${day}/${month + 1}/${year} - Đã có hành động được duyệt` : `Ngày ${day}/${month + 1}/${year}`}
            >
              <span className="day-number">{day}</span>
              {approved && <span className="approved-indicator" aria-label="Đã được duyệt">✓</span>}
            </div>
          );
        })}
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color approved"></div>
          <span>Ngày được duyệt</span>
        </div>
        <div className="legend-item">
          <div className="legend-color today"></div>
          <span>Hôm nay</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;

