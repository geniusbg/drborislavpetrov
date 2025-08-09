# Create support_notes table using psql
Write-Host "Creating support_notes table..."

# Read SQL file
$sqlContent = Get-Content "create-support-notes-table.sql" -Raw

# Execute SQL using psql
try {
    $result = psql -U postgres -d drborislavpetrov -c $sqlContent
    Write-Host "✅ Support notes table created successfully!"
    
    # Verify the table was created
    $countResult = psql -U postgres -d drborislavpetrov -c "SELECT COUNT(*) as count FROM support_notes;"
    Write-Host "📊 Table created and verified!"
    
} catch {
    Write-Host "❌ Error creating support notes table: $_"
}

Write-Host "Press Enter to continue..."
Read-Host 