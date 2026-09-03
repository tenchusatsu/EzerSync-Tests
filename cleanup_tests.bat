@echo off
echo Cleaning up Playwright dummy test households...
del "C:\Users\janlu\Desktop\family_calendar_data\test*.json" 2>nul
del "C:\Users\janlu\Desktop\family_calendar_data\overflow*.json" 2>nul
del "C:\Users\janlu\Desktop\family_calendar_data\regression*.json" 2>nul
del "C:\Users\janlu\Desktop\family_calendar_data\auth*.json" 2>nul
echo Cleanup complete!
