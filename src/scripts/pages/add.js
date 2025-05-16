// Cari bagian yang menangani form submit

// Tambahkan di lokasi yang tepat, setelah cerita berhasil ditambahkan
window.sendNewStoryNotification({
  id: result.id, // Sesuaikan dengan struktur response API
  title: result.name || formData.get('title') // Sesuaikan dengan struktur API
}); 