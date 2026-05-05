async function downloadLog(format, btn) {
    const originalText = btn.innerText;
    btn.innerText = "Generazione...";
    btn.disabled = true;
    btn.style.opacity = "0.7";

    try {
        const url = `/api/export/${format}`;
        const response = await fetch(url);

        if (!response.ok) throw new Error(`Errore server: ${response.status}`);

        const blob = await response.blob();
        
        if (blob.size < 2) throw new Error("Il file generato è vuoto");

        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        
        const date = new Date().toISOString().split('T')[0];
        a.download = `system_report_${date}.${format}`;
        
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);

    } catch (err) {
        console.error("Export failed:", err);
        alert("Errore: " + err.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
        btn.style.opacity = "1";
    }
}