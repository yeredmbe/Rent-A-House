import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Alert } from 'react-native';
import { showToast } from "rn-snappy-toast";
import { create } from "zustand";
import uploadToCloudinary from "../app/lib/uploadToCloudinary";
import i18next from "../Services/i18next";

const CACHE_KEYS = {
  homes: 'cached_homes',
  recentPosts: 'cached_recent_posts',
  favorites: 'cached_favorites',
  homeById: (id) => `cached_home_${id}`,
};

export const homeStore = create((set,get)=>({
    isLoading:false,
    Homes:[],
    isAvailableHome:[],
    recentPosted:[],
    Home:[],
    favoriteHome:[],
    categoryHome:[],
    userHouse:[],
    userHouseLoading:false,
    userHouseListing:[],
    HouseReview:[],
    filteredHomes: [],
    loading: false,
    error: null,
    filterCount: 0,
    
createHome: async (formData) => {
  const storedToken = await AsyncStorage.getItem('token');
  const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
  set({ isLoading: true });

  try {
    let uploadedFormData = { ...formData };
    
    try {
      new URL(formData.whatsapp_url);
    } catch (error) {
      throw new Error("Enter valid links for your accounts");
    }

    if (formData.home_cover && formData.home_cover.startsWith('data:image')) {
      const homeCoverUrl = await uploadToCloudinary(formData.home_cover);
      uploadedFormData.home_cover = homeCoverUrl.secure_url;
    }

    if (formData.details && Array.isArray(formData.details)) {
      const uploadedDetails = await Promise.all(
        formData.details.map(async (image) => {
          if (image.startsWith('data:image')) {
            const uploadedImage = await uploadToCloudinary(image);
            return uploadedImage.secure_url;
          }
          return image;
        })
      );
      uploadedFormData.details = uploadedDetails;
    }

    const response = await fetch(
      "https://rent-a-house-r0jt.onrender.com/api/v1/home/create-home",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(uploadedFormData),
      }
    );

    if (!response.ok) {
      throw new Error(responseData.message || "Server error");
    }

    const responseText = await response.text();
    const responseData = JSON.parse(responseText);
    router.replace(`/House/${responseData.newHome._id}`)
    
    showToast({
      message: i18next.t("Property listed successfully!"),
      duration: 5000,
      type: 'success',
      position: 'top',
      title: 'Success',
      animationType: 'slide',
      progressBar: true,
      richColors: true,
    });

    set({ Home: [...get().Homes, responseData.home] });
    return responseData;

  } catch (err) {
    throw err;
  } finally {
    set({ isLoading: false });
  }
}, 

getAllHomes: async () => {
  try {
    const storedToken = await AsyncStorage.getItem('token');
    const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;

    const cached = await AsyncStorage.getItem(CACHE_KEYS.homes);
    if (cached) {
      set({ Homes: JSON.parse(cached) });
    }

    set({ isLoading: !cached });

    const response = await fetch("https://rent-a-house-r0jt.onrender.com/api/v1/home/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();

    if (!data || !Array.isArray(data.homes)) {
      set({ isLoading: false });
      return;
    }

    set({ isLoading: false, Homes: data.homes });
    await AsyncStorage.setItem(CACHE_KEYS.homes, JSON.stringify(data.homes));

  } catch (error) {
    set({ isLoading: false });
  }
},

recentlyPosted: async () => {
  try {
    const storedToken = await AsyncStorage.getItem('token');
    const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;

    const cached = await AsyncStorage.getItem(CACHE_KEYS.recentPosts);
    if (cached) {
      set({ recentPosted: JSON.parse(cached) });
    }

    set({ isLoading: !cached });

    const response = await fetch("https://rent-a-house-r0jt.onrender.com/api/v1/home/recently-posted", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();

    if (!data || !Array.isArray(data.homes)) {
      set({ isLoading: false });
      return;
    }

    set({ isLoading: false, recentPosted: data.homes });
    await AsyncStorage.setItem(CACHE_KEYS.recentPosts, JSON.stringify(data.homes));

  } catch (error) {
    set({ isLoading: false, recentPosted: [] });
  }
},

getHomeById: async (id) => {
  const storedToken = await AsyncStorage.getItem('token');
  const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;

  // Load cache immediately
  const cached = await AsyncStorage.getItem(CACHE_KEYS.homeById(id));
  if (cached) {
    set({ Home: JSON.parse(cached) });
  }

  // Only show spinner if there's no cached data
  set({ isLoading: !cached });

  try {
    const response = await fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/home/get-a-home/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!data.home) {
      Alert.alert(i18next.t("No Homes Found"), i18next.t("Error."));
    }
    set({ isLoading: false, Home: data.home });
    await AsyncStorage.setItem(CACHE_KEYS.homeById(id), JSON.stringify(data.home));
  } catch (err) {
    console.log(err.message);
    set({ isLoading: false });
  }
},

deleteHome: async (id) => {
  const storedToken = await AsyncStorage.getItem('token');
  const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
  set({ isLoading: true });
  try {
    const response = await fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/home/delete-home/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    const data = await response.json();
    set({ isLoading: false });
    await AsyncStorage.removeItem(CACHE_KEYS.homeById(id));
  } catch (err) {
    set({ isLoading: false });
  }
},

editHome: async (id, formData) => {
  const storedToken = await AsyncStorage.getItem('token');
  const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
  set({ isLoading: true });
  try {
    const response = await fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/home/edit-home/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    const data = await response.json();
    console.log(data);
    set({ isLoading: false });
    await AsyncStorage.removeItem(CACHE_KEYS.homeById(id));
  } catch (err) {
    console.log(err.message);
    set({ isLoading: false });
  }
},

getFavorites: async () => {
  try {
    const storedToken = await AsyncStorage.getItem('token');
    const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;

    const cached = await AsyncStorage.getItem(CACHE_KEYS.favorites);
    if (cached) {
      set({ favoriteHome: JSON.parse(cached) });
    }

    set({ isLoading: !cached });

    const response = await fetch("https://rent-a-house-r0jt.onrender.com/api/v1/home/favorite", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });
    const { homes } = await response.json();
    set({ isLoading: false, favoriteHome: homes ?? [] });
    await AsyncStorage.setItem(CACHE_KEYS.favorites, JSON.stringify(homes ?? []));
  } catch (err) {
    console.log(err.message);
    set({ isLoading: false, favoriteHome: [] });
  }
},

addToFavorite: async (id) => {
  const storedToken = await AsyncStorage.getItem('token');
  const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
  set({ isLoading: true });
  try {
    const response = await fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/home/favorite/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });
    const data = await response.json();
    set({ isLoading: false });
    // Invalidate favorites cache so next visit fetches fresh data
    await AsyncStorage.removeItem(CACHE_KEYS.favorites);
    showToast({
      message: "Success...",
      duration: 5000,
      type: 'success',
      position: 'top',
      title: 'Success',
      animationType: 'slide',
      progressBar: true,
      richColors: true,
    });
  } catch (err) {
    console.log(err.message);
    set({ isLoading: false });
  }
},

isAvailable: async () => {
  const storedToken = await AsyncStorage.getItem('token');
  const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
  set({ isLoading: true });
  try {
    const response = await fetch("https://rent-a-house-r0jt.onrender.com/api/v1/home/is-available", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    const data = await response.json();
    if (!data.homes) {
      showToast({
        message: i18next.t("No Homes Found Reload page"),
        duration: 5000,
        type: 'warning',
        position: 'top',
        title: 'Warning',
        animationType: 'slide',
        progressBar: true,
        richColors: true,
      });
    }
    set({ isLoading: false, isAvailableHome: data.homes });
  } catch (err) {
    console.log(err.message);
    set({ isLoading: false });
  }
},

getByCategory: async (category) => {
  const storedToken = await AsyncStorage.getItem('token');
  const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
  set({ isLoading: true });
  try {
    const response = await fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/home/category/${category}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    const data = await response.json();
    if (!data.homes) {
      showToast({
        message: i18next.t("No homes found reload page"),
        duration: 5000,
        type: 'info',
        position: 'top',
        title: 'Info',
        animationType: 'slide',
        progressBar: true,
        richColors: true,
      });
    }
    set({ isLoading: false, categoryHome: data.homes });
  } catch (err) {
    console.log(err.message);
    set({ isLoading: false });
  }
},

getUsersListings: async () => {
  set({ userHouseLoading: true });
  const storedToken = await AsyncStorage.getItem('token');
  const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
  try {
    const response = await fetch("https://rent-a-house-r0jt.onrender.com/api/v1/home/get-all-user-houses", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.userHomes)) {
      set({ userHouseListing: [] });
      return;
    }

    set({ userHouseListing: data.userHomes });
  } catch (err) {
    set({ userHouseListing: [] });
  } finally {
    set({ userHouseLoading: false });
  }
},

addReview: async (id, review) => {
  const storedToken = await AsyncStorage.getItem("token");
  const token = storedToken.startsWith('"') ? JSON.parse(storedToken) : storedToken;
  try {
    const response = await fetch(
      `https://rent-a-house-r0jt.onrender.com/api/v1/home/add-review/${id}`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(review),
      }
    );
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      // console.error("Response was not JSON:", err.message);
    }
  } catch (err) {
    console.log(err.message);
  }
},

getHouseOnFilter: async (filters = {}) => {
  set({ loading: true, error: null });
  try {
    const queryParams = new URLSearchParams();

    if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
    if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.region) queryParams.append('region', filters.region);

    const queryString = queryParams.toString();
    const url = `https://rent-a-house-r0jt.onrender.com/api/v1/home/filtered-homes${queryString ? `?${queryString}` : ''}`;

    const storedToken = await AsyncStorage.getItem('token');
    const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      // console.log(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    set({
      filteredHomes: data.filteredHomes || [],
      filterCount: data.count || 0,
      loading: false
    });
    return data;

  } catch (err) {
    set({
      error: err.message,
      loading: false,
      filteredHomes: [],
      filterCount: 0
    });
    throw err;
  }
},

toggleHouseAvailability: async (id) => {
  try {
    const storedToken = await AsyncStorage.getItem('token');
    const token = storedToken.startsWith('"') ? JSON.parse(storedToken) : storedToken;

    const response = await fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/home/edit-availability/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.ok) {
      showToast({
        message: i18next.t("home status change successfully"),
        duration: 5000,
        type: 'success',
        position: 'top',
        title: 'Success',
        animationType: 'slide',
        progressBar: true,
        richColors: true,
      });
    }
  } catch (err) {
    // console.log(err.message)
  }
},

}))