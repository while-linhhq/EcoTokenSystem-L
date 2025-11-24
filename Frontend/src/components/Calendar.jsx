import { useState, useMemo } from 'react';
import './Calendar.css';

const Calendar = ({ approvedDates = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Convert approved dates to Set for quick lookup (format: YYYY-MM-DD)
  const approvedDatesSet = useMemo(() => {
    return new Set(
      approvedDates.map(date => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })
    );
  }, [approvedDates]);

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

  const approvedCount = approvedDatesSet.size;

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h3>📅 Lịch sống xanh</h3>
        <p className="calendar-subtitle">
          {approvedCount} ngày đã được duyệt trong tháng này
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
              title={approved ? `Ngày ${day} - Đã có hành động được duyệt` : `Ngày ${day}`}
            >
              <span className="day-number">{day}</span>
              {approved && <span className="approved-indicator">✓</span>}
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

