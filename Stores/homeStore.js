import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Alert } from 'react-native';
import { showToast } from "rn-snappy-toast";
import { create } from "zustand";
import uploadToCloudinary from "../app/lib/uploadToCloudinary";
import i18next from "../Services/i18next";


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
    
    // Validate URL without showing toast
    try {
      new URL(formData.whatsapp_url);
    } catch (error) {
      throw new Error("Enter valid links for your accounts");
    }

    // Upload home_cover if it exists and is a base64 string
    if (formData.home_cover && formData.home_cover.startsWith('data:image')) {
      const homeCoverUrl = await uploadToCloudinary(formData.home_cover);
      uploadedFormData.home_cover = homeCoverUrl.secure_url;
    }

    // Upload details images if they exist
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

    // Handle non-200 responses
    if (!response.ok) {
      throw new Error(responseData.message || "Server error");
    }

    const responseText = await response.text();
    const responseData = JSON.parse(responseText);
    router.replace(`/House/${responseData.newHome._id}`)
    
       //Success case
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
    throw err; // Just re-throw the error, don't handle it here
  } finally {
    set({ isLoading: false });
  }
}, 
getAllHomes: async () => {
  try {
    const storedToken = await AsyncStorage.getItem('token');
    const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
    
    set({ isLoading: true });
    
    const response = await fetch("https://rent-a-house-r0jt.onrender.com/api/v1/home/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    // Check if response is successful
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // More robust check for homes array
    if (!data || !Array.isArray(data.homes)) {
      Alert.alert(i18next.t("No Homes Found"), i18next.t("Reload page"));
      set({ isLoading: false, Homes: [] }); // Set empty array instead of undefined
      return;
    }
    
    set({ isLoading: false, Homes: data.homes });
    
  } catch (error) {
    // console.error('Error fetching homes:', error.message);
    set({ isLoading: false, Homes: [] }); // Set empty array on error
    // Alert.alert('Error', 'Failed to fetch homes');
  }
},

recentlyPosted: async () => {
  try {
    const storedToken = await AsyncStorage.getItem('token');
    const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
    
    set({ isLoading: true });
    
    const response = await fetch("https://rent-a-house-r0jt.onrender.com/api/v1/home/recently-posted", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    // Check if response is successful
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // More robust check for homes array
    if (!data || !Array.isArray(data.homes)) {
      Alert.alert(i18next.t("No Homes Found"), i18next.t("Reload page"));
      set({ isLoading: false, recentPosted: [] }); // Set empty array instead of undefined
      return;
    }
    
    set({ isLoading: false, recentPosted: data.homes });
    
  } catch (error) {
    // console.error('Error fetching recently posted:', error.message);
    set({ isLoading: false, recentPosted: [] }); // Set empty array on error
    // Alert.alert('Error', 'Failed to fetch recently posted homes');
  }
},
    getHomeById:async(id)=>{
      const storedToken = await AsyncStorage.getItem('token');
  const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
        set({isLoading:true})
        try{
        const response=await fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/home/get-a-home/${id}`,
          {  method:"GET",
            headers:{
                "Content-Type":"application/json",
                "Authorization":`Bearer ${token}`
            }}
        )
        const data=await response.json()
        if(!data.home){
            Alert.alert(i18next.t("No Homes Found"),i18next.t("Error."))
        }
        // console.log(data)
        set({isLoading:false,Home:data.home})
    } catch(err){
          console.log(err.message)
        // Alert.alert("Error","Failed to upload")
    }
    },  
    deleteHome:async(id)=>{
      const storedToken = await AsyncStorage.getItem('token');
  const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
     set({isLoading:true})
     try{
     const response=await fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/home/delete-home/${id}`,{
        method:"DELETE",
                        headers:{
            "Content-Type":"application/json",
            "Authorization":`Bearer ${token}`
        },
     })
     const data=await response.json()
    //  console.log(data)
     set({isLoading:false})
    } catch(err){
          // console.log(err.message)
        // Alert.alert("Error","Failed to upload")
    }
    },
    editHome:async(id,formData)=>{
      const storedToken = await AsyncStorage.getItem('token');
  const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
        set({isLoading:true})
        try{
        const response=await fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/home/edit-home/${id}`,{
            method:"PUT",
            headers:{
                 "Content-Type":"application/json",
            "Authorization":`Bearer ${token}`
            },
            body:JSON.stringify(formData)
        })
        const data=await response.json()
        console.log(data)
        set({isLoading:false})
    }catch(err){
          console.log(err.message)
        // Alert.alert("Error","Failed to upload")
    }
    },
    getFavorites:async()=>{
      try{
      const storedToken = await AsyncStorage.getItem('token');
  const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
        set({isLoading:true})
        const response=await fetch("https://rent-a-house-r0jt.onrender.com/api/v1/home/favorite",{
            method:"GET",
            headers:{
                 "Content-Type":"application/json",
            "Authorization":`Bearer ${token}`
            }
        })
        const {homes}=await response.json()
        // console.log(homes)
        set({isLoading:false,favoriteHome:homes ?? []})
}catch(err){
          console.log(err.message)
          set({isLoading:false,favoriteHome:[]})
        // Alert.alert("Error","Failed to upload")
}
            },
 addToFavorite:async(id)=>{
              const storedToken = await AsyncStorage.getItem('token');
            const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
                set({isLoading:true})
                try{
           const response=await fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/home/favorite/${id}`,{
              method:"POST",
              headers:{
                 "Content-Type":"application/json",
            "Authorization":`Bearer ${token}`
              }
           })
           const data=await response.json()
           set({isLoading:false})
            showToast({
                message: "Success...",
                duration: 5000,
                type: 'success',
                position: 'top',
                title: 'Success',
                animationType: 'slide',
                progressBar: true,
                richColors: true,
              })
        }
        catch(err){
              console.log(err.message)
        // Alert.alert("Error","Failed to upload")
        }  
              },

isAvailable:async()=>{
          const storedToken = await AsyncStorage.getItem('token');
           const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
          set({isLoading:true})
          try{
          const response=await fetch("https://rent-a-house-r0jt.onrender.com/api/v1/home/is-available",{
            method:"GET",
            headers:{
                 "Content-Type":"application/json",
            "Authorization":`Bearer ${token}`
            },
          })
          const data=await response.json()
          if(!data.homes){
             showToast({
                message: i18next.t("No Homes Found Reload page"),
                duration: 5000,
                type: 'warning',
                position: 'top',
                title: 'Warning',
                animationType: 'slide',
                progressBar: true,
                richColors: true,
              })
        }
          // console.log(data)
          set({isLoading:false,isAvailableHome:data.homes})
    }catch(err){
          console.log(err.message)
        // Alert.alert("Error","Failed to upload")
    }
    },
     getByCategory:async(category)=>{
      const storedToken = await AsyncStorage.getItem('token');
  const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
        set({isLoading:true})
        try{
        const response=await fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/home/category/${category}`,{
            method:"GET",
            headers:{
                 "Content-Type":"application/json",
            "Authorization":`Bearer ${token}`
            },
        })
        const data=await response.json()
        if(!data.homes){
            showToast({
                message: i18next.t("No homes found reload page"),
                duration: 5000,
                type: 'info',
                position: 'top',
                title: 'Info',
                animationType: 'slide',
                progressBar: true,
                richColors: true,
              })
        }
        // console.log(data)
        set({isLoading:false,categoryHome:data.homes})
    }catch(err){
          console.log(err.message)
        // Alert.alert("Error","Failed to upload")
    } 
},
// In your homeStore
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
        
        // Check if response is ok
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Better error handling for the response structure
        if (!data || !Array.isArray(data.userHomes)) {
            set({ userHouseListing: [] });
            return;
        }
        
        set({ userHouseListing: data.userHomes });
        // console.log("Houses fetched successfully:", data.userHomes.length);
        
    } catch (err) {
        // console.log("Error fetching listings:", err.message);
        set({ userHouseListing: [] }); // Ensure it's always an array
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
          "Content-Type": "application/json", // ✅ important
        },
        body: JSON.stringify(review), // review = { text: "..." }
      }
    );

    const text = await response.text(); // debug raw response
    // console.log("Raw response:", text);

    let data;
    try {
      data = JSON.parse(text);
      // console.log("Parsed JSON:", data);
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
            // Build query string from filters
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
            // console.log("Error filtering houses:", err.message);
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

  try{
    const storedToken = await AsyncStorage.getItem('token');
    const token=storedToken.startsWith('"') ? JSON.parse(storedToken) : storedToken;

    const response=await fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/home/edit-availability/${id}`,{
      method:"PUT",
      headers:{
        "Content-Type": "application/json",
         "Authorization": `Bearer ${token}`
      }
    })

    if(response.ok){
        showToast({
          message: i18next.t("home status change successfully"),
                duration: 5000,
                type: 'success',
                position: 'top',
                title: 'Success',
                animationType: 'slide',
                progressBar: true,
                richColors: true,
        })
    }


  }catch(err){
    // console.log(err.message)
  }
},

}))