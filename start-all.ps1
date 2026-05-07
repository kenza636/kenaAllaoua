# ============================================================
# Lance les 5 services + ouvre les navigateurs automatiquement
# ============================================================

$projetRoot = $PSScriptRoot

Write-Host "Demarrage des 5 services..." -ForegroundColor Cyan

# Backend (port 5000)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projetRoot\backend'; Write-Host 'BACKEND (port 5000)' -ForegroundColor Green; npm run dev"

Start-Sleep -Seconds 3

# App d'entree (port 5173)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projetRoot\mon-projet-sante'; Write-Host 'APP ENTREE (port 5173)' -ForegroundColor Green; npm run dev"

Start-Sleep -Seconds 5
Start-Process "http://localhost:5173"

# Frontend patient (port 5174)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projetRoot\frontend-patient'; Write-Host 'FRONTEND PATIENT (port 5174)' -ForegroundColor Green; npm run dev"

Start-Sleep -Seconds 5
Start-Process "http://localhost:5174"

# Frontend medecin (port 5175)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projetRoot\frontend-medecin'; Write-Host 'FRONTEND MEDECIN (port 5175)' -ForegroundColor Green; npm run dev"

Start-Sleep -Seconds 5
Start-Process "http://localhost:5175"

# Frontend admin (port 5176)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projetRoot\frontend-admin'; Write-Host 'FRONTEND ADMIN (port 5176)' -ForegroundColor Green; npm run dev"

Start-Sleep -Seconds 5
Start-Process "http://localhost:5176"

Write-Host ""
Write-Host "Tous les services sont lances + navigateurs ouverts." -ForegroundColor Green