@echo off
echo ========================================
echo Disaster Management Server - Firewall Setup
echo ========================================
echo.
echo This will add firewall rules to allow Node.js on port 3000
echo.
pause

echo Adding inbound rule for port 3000...
netsh advfirewall firewall add rule name="Disaster Management Server" dir=in action=allow protocol=TCP localport=3000

echo.
echo ========================================
echo Firewall rule added successfully!
echo ========================================
echo.
echo Server should now be accessible from mobile devices on the same network.
echo Server URL: http://192.168.1.6:3000
echo.
pause
