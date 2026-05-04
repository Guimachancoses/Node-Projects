// MobileCalendarToolbar.js
import moment from "moment";
import { Box, IconButton, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TodayIcon from "@mui/icons-material/Today";

const MobileCalendarToolbar = ({ date, view, onView, onNavigate, views }) => {
  const dateValue = moment(date).format("YYYY-MM-DD");

  const handleDateChange = (e) => {
    const selected = e.target.value; // yyyy-mm-dd
    if (!selected) return;

    // meio-dia evita bugs de fuso em alguns celulares
    const nextDate = new Date(`${selected}T12:00:00`);
    onNavigate("DATE", nextDate);
  };

  return (
    <Box sx={{ p: 1, display: "grid", gap: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <IconButton size="small" onClick={() => onNavigate("PREV")}>
          <ChevronLeftIcon />
        </IconButton>

        <TextField
          type="date"
          size="small"
          value={dateValue}
          onChange={handleDateChange}
          sx={{ minWidth: 170 }}
        />

        <IconButton size="small" onClick={() => onNavigate("NEXT")}>
          <ChevronRightIcon />
        </IconButton>

        <IconButton size="small" onClick={() => onNavigate("TODAY")}>
          <TodayIcon />
        </IconButton>
      </Box>

      <ToggleButtonGroup
        value={view}
        exclusive
        onChange={(_, v) => v && onView(v)}
        size="small"
        fullWidth
      >
        {views.includes("day") && <ToggleButton value="day">Dia</ToggleButton>}
        {views.includes("agenda") && <ToggleButton value="agenda">Agenda</ToggleButton>}
        {views.includes("week") && <ToggleButton value="week">Semana</ToggleButton>}
        {views.includes("month") && <ToggleButton value="month">Mês</ToggleButton>}
      </ToggleButtonGroup>
    </Box>
  );
};

export default MobileCalendarToolbar;