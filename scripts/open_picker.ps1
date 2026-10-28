Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName Microsoft.VisualBasic

$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.Filter = "All Supported Formats (*.pdf;*.md;*.txt;*.json)|*.pdf;*.md;*.txt;*.json|PDF Files (*.pdf)|*.pdf|Text/Markdown (*.txt;*.md)|*.txt;*.md|JSON Datasets (*.json)|*.json"
$dialog.Title = "Select 5e Rulebook, Sourcebook, or Campaign File"

# Force dialog to foreground
$dialog.ShowHelp = $true

$result = $dialog.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
    $filePath = $dialog.FileName
    $fileName = [System.IO.Path]::GetFileNameWithoutExtension($filePath)
    $defaultBookName = (Get-Culture).TextInfo.ToTitleCase($fileName.Replace("_", " ").Replace("-", " "))

    $bookName = [Microsoft.VisualBasic.Interaction]::InputBox("Enter the canonical title for this 5e Rulebook / Sourcebook:", "5e Rulebook Ingestion", $defaultBookName)

    if ($bookName) {
        Write-Host "Ingesting: $bookName from $filePath"
        python scripts/ingest_rulebook.py --file "$filePath" --book "$bookName"
    } else {
        Write-Host "Ingestion cancelled: No title provided."
    }
} else {
    Write-Host "Ingestion cancelled by user."
}
