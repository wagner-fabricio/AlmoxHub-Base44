/**
 * Comprime uma imagem antes do upload
 * @param {File} file - Arquivo de imagem
 * @param {Object} options - Opções de compressão
 * @returns {Promise<Blob>} - Imagem comprimida
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    mimeType = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calcular novas dimensões mantendo aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Falha ao comprimir imagem'));
            }
          },
          mimeType,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Falha ao carregar imagem'));
    };
    
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
  });
}

/**
 * Valida e prepara arquivo de imagem para upload
 * @param {File} file - Arquivo de imagem
 * @param {Object} options - Opções
 * @returns {Promise<File>} - Arquivo pronto para upload
 */
export async function prepareImageForUpload(file, options = {}) {
  const {
    maxSizeMB = 5,
    compress = true
  } = options;

  // Verificar tamanho
  const fileSizeMB = file.size / (1024 * 1024);
  
  if (fileSizeMB > maxSizeMB && compress) {
    // Comprimir se necessário
    const compressedBlob = await compressImage(file, {
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080
    });
    
    return new File([compressedBlob], file.name, {
      type: compressedBlob.type,
      lastModified: Date.now()
    });
  }
  
  return file;
}