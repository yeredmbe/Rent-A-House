

const uploadToCloudinary = async (base64String) => {
  try {
    const formData = new FormData();
    formData.append('file', base64String);
    formData.append('upload_preset', 'RentAHouse'); // You need to set this up in Cloudinary
    formData.append('folder', 'user-profiles');

    const response = await fetch(`https://api.cloudinary.com/v1_1/dcihzr5rr/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    // console.log('Cloudinary response:', data);
    return data; // Return the an object
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export default uploadToCloudinary;
