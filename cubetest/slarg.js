export function saveSLARG(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export function loadSLARG() {
  return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.slarg';
      input.onchange = (e) => {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
              try {
                  const data = JSON.parse(event.target.result);
                  resolve(data);
              } catch (error) {
                  reject(new Error("Failed to parse .SLARG file."));
              }
          };
          reader.onerror = () => reject(new Error("Failed to read file."));
          reader.readAsText(file);
      };
      input.click();
  });
}
