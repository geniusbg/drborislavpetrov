Write-Host "Removing duplicates from bug tracker..." -ForegroundColor Yellow

# Get all bugs
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/bugs" -Headers @{"x-admin-token"="admin-token"}
$bugs = $response.Content | ConvertFrom-Json

Write-Host "Total bugs found: $($bugs.bugs.Count)" -ForegroundColor Cyan

# Group by title to find duplicates
$groupedByTitle = @{}
foreach ($bug in $bugs.bugs) {
    $title = $bug.title.ToLower().Trim()
    if (-not $groupedByTitle.ContainsKey($title)) {
        $groupedByTitle[$title] = @()
    }
    $groupedByTitle[$title] += $bug
}

# Find duplicates
$duplicates = @()
foreach ($title in $groupedByTitle.Keys) {
    if ($groupedByTitle[$title].Count -gt 1) {
        $duplicates += @{
            title = $title
            bugs = $groupedByTitle[$title]
        }
    }
}

if ($duplicates.Count -eq 0) {
    Write-Host "No duplicates found!" -ForegroundColor Green
    exit
}

Write-Host "Found $($duplicates.Count) duplicate groups:" -ForegroundColor Red

# Find bugs to delete (keep oldest, delete newer)
$bugsToDelete = @()
foreach ($group in $duplicates) {
    $sortedBugs = $group.bugs | Sort-Object created_at
    # Delete all except the oldest (first)
    for ($i = 1; $i -lt $sortedBugs.Count; $i++) {
        $bugsToDelete += $sortedBugs[$i]
    }
}

Write-Host "Will delete $($bugsToDelete.Count) duplicates:" -ForegroundColor Yellow
foreach ($bug in $bugsToDelete) {
    Write-Host "   ID: $($bug.id) - $($bug.title)" -ForegroundColor Gray
}

# Delete duplicates
$deletedCount = 0
foreach ($bug in $bugsToDelete) {
    try {
        Write-Host "Deleting ID: $($bug.id)" -ForegroundColor Yellow
        $deleteResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/bugs?id=$($bug.id)" -Method DELETE -Headers @{"x-admin-token"="admin-token"}
        
        if ($deleteResponse.StatusCode -eq 200) {
            Write-Host "Successfully deleted ID: $($bug.id)" -ForegroundColor Green
            $deletedCount++
        } else {
            Write-Host "Failed to delete ID: $($bug.id)" -ForegroundColor Red
        }
        
        # Wait between deletions
        Start-Sleep -Seconds 1
        
    } catch {
        Write-Host "Error deleting ID $($bug.id): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "Duplicates found: $($bugsToDelete.Count)" -ForegroundColor Yellow
Write-Host "Successfully deleted: $deletedCount" -ForegroundColor Green
Write-Host "Failed to delete: $($bugsToDelete.Count - $deletedCount)" -ForegroundColor Red

Read-Host "Press Enter to continue" 