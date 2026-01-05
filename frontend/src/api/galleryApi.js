const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * ========================================
 * FOLDERS/ÁLBUMES - Público y Admin
 * ========================================
 */

export const getAllFolders = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.visible !== undefined) queryParams.append('visible', params.visible);
    if (params.destacado !== undefined) queryParams.append('destacado', params.destacado);
    if (params.event_id) queryParams.append('event_id', params.event_id);
    if (params.limit) queryParams.append('limit', params.limit);

    const response = await fetch(`${API_URL}/gallery/folders?${queryParams}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching folders:', error);
    throw error;
  }
};

export const getFeaturedFolders = async (limit = 6) => {
  try {
    const response = await fetch(`${API_URL}/gallery/featured?limit=${limit}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching featured folders:', error);
    throw error;
  }
};

export const getFolderByIdOrSlug = async (identifier) => {
  try {
    const response = await fetch(`${API_URL}/gallery/folders/${identifier}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching folder:', error);
    throw error;
  }
};

export const createFolder = async (folderData) => {
  try {
    const response = await fetch(`${API_URL}/gallery/folders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(folderData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

export const updateFolder = async (id, folderData) => {
  try {
    const response = await fetch(`${API_URL}/gallery/folders/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(folderData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating folder:', error);
    throw error;
  }
};

export const deleteFolder = async (id) => {
  try {
    const response = await fetch(`${API_URL}/gallery/folders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};

/**
 * ✅ NUEVO: Establecer imagen de portada
 */
export const setCoverImage = async (folderId, imageId) => {
  try {
    const response = await fetch(`${API_URL}/gallery/folders/${folderId}/cover`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ image_id: imageId })
    });
    return await response.json();
  } catch (error) {
    console.error('Error setting cover image:', error);
    throw error;
  }
};

/**
 * ========================================
 * IMÁGENES
 * ========================================
 */

export const getAllImagesWithArtists = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.folder_id) queryParams.append('folder_id', params.folder_id);
    if (params.artist_id) queryParams.append('artist_id', params.artist_id);
    if (params.limit) queryParams.append('limit', params.limit);

    const response = await fetch(`${API_URL}/gallery/images?${queryParams}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching images:', error);
    throw error;
  }
};

export const getFolderImages = async (folderId, visibleOnly = true) => {
  try {
    const response = await fetch(
      `${API_URL}/gallery/folders/${folderId}/images?visible_only=${visibleOnly}`
    );
    return await response.json();
  } catch (error) {
    console.error('Error fetching folder images:', error);
    throw error;
  }
};

export const uploadImage = async (folderId, formData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/gallery/folders/${folderId}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    return await response.json();
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * ✅ NUEVO: Subir múltiples imágenes
 */
export const uploadMultipleImages = async (folderId, imagesData, onProgress) => {
  try {
    const token = localStorage.getItem('token');
    const uploadedImages = [];
    const errors = [];

    for (let i = 0; i < imagesData.length; i++) {
      const { file, visible, destacado } = imagesData[i];
      
      try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('titulo', '');
        formData.append('descripcion', '');
        formData.append('visible', visible);
        formData.append('destacado', destacado);

        const response = await fetch(`${API_URL}/gallery/folders/${folderId}/images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const result = await response.json();
        
        if (result.success) {
          uploadedImages.push(result.data);
        } else {
          errors.push({ file: file.name, error: result.message });
        }
      } catch (err) {
        errors.push({ file: file.name, error: err.message });
      }

      // Actualizar progreso
      if (onProgress) {
        onProgress({
          [i]: Math.round(((i + 1) / imagesData.length) * 100)
        });
      }
    }

    return {
      success: true,
      data: {
        uploaded: uploadedImages.length,
        total: imagesData.length,
        errors: errors
      },
      message: errors.length > 0 
        ? `${uploadedImages.length} de ${imagesData.length} imágenes subidas. ${errors.length} errores.`
        : `${uploadedImages.length} imágenes subidas correctamente`
    };
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};

export const updateImage = async (id, imageData) => {
  try {
    const response = await fetch(`${API_URL}/gallery/images/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(imageData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating image:', error);
    throw error;
  }
};

/**
 * ✅ NUEVO: Actualizar múltiples imágenes
 */
export const bulkUpdateImages = async (imageIds, updates) => {
  try {
    const response = await fetch(`${API_URL}/gallery/images/bulk-update`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ image_ids: imageIds, updates })
    });
    return await response.json();
  } catch (error) {
    console.error('Error bulk updating images:', error);
    throw error;
  }
};

export const deleteImage = async (id) => {
  try {
    const response = await fetch(`${API_URL}/gallery/images/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

/**
 * ✅ NUEVO: Eliminar múltiples imágenes
 */
export const bulkDeleteImages = async (imageIds) => {
  try {
    const response = await fetch(`${API_URL}/gallery/images/bulk-delete`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ image_ids: imageIds })
    });
    return await response.json();
  } catch (error) {
    console.error('Error bulk deleting images:', error);
    throw error;
  }
};

export const reorderImages = async (folderId, imageIds) => {
  try {
    const response = await fetch(`${API_URL}/gallery/folders/${folderId}/images/reorder`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ image_ids: imageIds })
    });
    return await response.json();
  } catch (error) {
    console.error('Error reordering images:', error);
    throw error;
  }
};

/**
 * ========================================
 * ARTISTAS EN IMÁGENES
 * ========================================
 */

export const getImageArtists = async (imageId) => {
  try {
    const response = await fetch(`${API_URL}/gallery/images/${imageId}/artists`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching image artists:', error);
    throw error;
  }
};

export const addArtistToImage = async (imageId, artistId) => {
  try {
    const response = await fetch(`${API_URL}/gallery/images/${imageId}/artists`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ artist_id: artistId })
    });
    return await response.json();
  } catch (error) {
    console.error('Error adding artist to image:', error);
    throw error;
  }
};

export const updateImageArtists = async (imageId, artistIds) => {
  try {
    const response = await fetch(`${API_URL}/gallery/images/${imageId}/artists`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ artist_ids: artistIds })
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating image artists:', error);
    throw error;
  }
};

export const removeArtistFromImage = async (imageId, artistId) => {
  try {
    const response = await fetch(`${API_URL}/gallery/images/${imageId}/artists/${artistId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error removing artist from image:', error);
    throw error;
  }
};

/**
 * ========================================
 * ARTISTAS EN ÁLBUMES
 * ========================================
 */

export const getFolderArtists = async (folderId) => {
  try {
    const response = await fetch(`${API_URL}/gallery/folders/${folderId}/artists`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching folder artists:', error);
    throw error;
  }
};

export const addArtistToFolder = async (folderId, artistId) => {
  try {
    const response = await fetch(`${API_URL}/gallery/folders/${folderId}/artists`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ artist_id: artistId })
    });
    return await response.json();
  } catch (error) {
    console.error('Error adding artist to folder:', error);
    throw error;
  }
};

export const updateFolderArtists = async (folderId, artistIds) => {
  try {
    const response = await fetch(`${API_URL}/gallery/folders/${folderId}/artists`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ artist_ids: artistIds })
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating folder artists:', error);
    throw error;
  }
};

export const removeArtistFromFolder = async (folderId, artistId) => {
  try {
    const response = await fetch(`${API_URL}/gallery/folders/${folderId}/artists/${artistId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error removing artist from folder:', error);
    throw error;
  }
};

export const getContentByArtist = async (artistId) => {
  try {
    const response = await fetch(`${API_URL}/gallery/artists/${artistId}/content`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching artist content:', error);
    throw error;
  }
};

export const getGalleryStats = async () => {
  try {
    const response = await fetch(`${API_URL}/gallery/stats`, {
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching gallery stats:', error);
    throw error;
  }
};
