import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import { Alert } from 'react-native';
import { showToast } from 'rn-snappy-toast';
import { io } from "socket.io-client";
import { create } from "zustand";
import uploadToCloudinary from "../app/lib/uploadToCloudinary";


export const useStore = create((set,get) => ({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    error: null,
    token: null,
    isProfilePicUploaded: false,
    isProfileLoading:false,
    userProfile:null,
    socket: null,
  register: async (fields) => {
    set({ isLoading: true });
    try {
        const response = await fetch("https://rent-a-house-r0jt.onrender.com/api/v1/user/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fields),
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle error from backend
            set({ isLoading: false });
            showToast({
                message: data.message || "Registration failed",
                duration: 5000,
                type: 'error',
                position: 'top',
                title: 'Error',
                animationType: 'slideFromLeft',
                progressBar: true,
                richColors: true,
            });
            Alert.alert("Error", data.message || "Registration failed");
            return ;
        }

        // Success path
        if (data.user && data.token) {
            set({ user: data.user, token: data.token, isLoading: false });
            await AsyncStorage.setItem("token", JSON.stringify(data.token));
            await AsyncStorage.setItem("user", JSON.stringify(data.user));
            get().connectSocket();
        } else {
            set({ isLoading: false });
        }

        showToast({
            message: data.message,
            duration: 5000,
            type: 'success',
            position: 'top',
            title: 'Success',
            animationType: 'slideFromLeft',
            progressBar: true,
            richColors: true,
        });
        Alert.alert("Success", data.message);

         return data; // okay to return here since no success toast after


    } catch (error) {
        set({ error: error.message, isLoading: false });
        console.log("Register error:", error.message);
        showToast({
            message: "Network issues, try again later.",
            duration: 5000,
            type: 'error',
            position: 'top',
            title: 'Error',
            animationType: 'slideFromLeft',
            progressBar: true,
            richColors: true,
        });
        Alert.alert("Error", "Network issues, try again later.");
    }
},

login: async (user) => {
    set({ isLoading: true });
    try {
        const response = await fetch("https://rent-a-house-r0jt.onrender.com/api/v1/user/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user),
        });

        const data = await response.json();

        if (!response.ok) {
            set({ isLoading: false });
            showToast({
                message: data.message || "Login failed",
                duration: 5000,
                type: 'error',
                position: 'top',
                title: 'Error',
                animationType: 'slideFromLeft',
                progressBar: true,
                richColors: true,
            });
             Alert.alert("Error", data.message || "Login failed");

            return data; // okay to return here since no success toast after
        }

        if (data.user && data.token) {
            set({ user: data.user, token: data.token, isLoading: false });
            await AsyncStorage.setItem("token", JSON.stringify(data.token));
            await AsyncStorage.setItem("user", JSON.stringify(data.user));
            get().connectSocket();

          showToast({
                message: data.message,
                duration: 5000,
                type: 'success',
                position: 'top',
                title: 'Success',
                animationType: 'slideFromLeft',
                progressBar: true,
                richColors: true,
            });
         Alert.alert("Success", data.message || "Login successful");
          
        return data;
        } else {
            set({ isLoading: false });
            showToast({
                message: data.message || "Login failed",
                duration: 5000,
                type: 'error',
                position: 'top',
                title: 'Error',
                animationType: 'slideFromLeft',
                progressBar: true,
                richColors: true,
            });
        }

    } catch (error) {
        set({ error: error.message, isLoading: false });
        console.log("Login error:", error.message);
        showToast({
            message: "Network issues, try again later.",
            duration: 5000,
            type: 'error',
            position: 'top',
            title: 'Error',
            animationType: 'slideFromLeft',
            progressBar: true,
            richColors: true,
        });
        Alert.alert("Error", "Network issues, try again later.");
    }
},

 getUser: async () => {
  set({ isLoading: true });

  try {
    // Get token and user from storage
    const storedToken = await AsyncStorage.getItem("token");
    const storedUser = await AsyncStorage.getItem("user");

    // If nothing stored → user is logged out
    if (!storedToken || !storedUser) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return;
    }

    // Parse values if stringified
    const token = storedToken.startsWith('"')
      ? JSON.parse(storedToken)
      : storedToken;

    const user = storedUser.startsWith('{')
      ? JSON.parse(storedUser)
      : storedUser;

    // SUCCESS → restore session instantly
    set({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });

    // Connect socket AFTER user is restored
    get().connectSocket();

  } catch (error) {
    console.log("Error restoring user:", error.message);

    // Ensure clean logout state
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: error.message,
    });
  }
},

logout: async () => {
     router.replace("/SignIn");
    set({ user: null, token: null, isAuthenticated: false });
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    get().disconnectSocket();
  },
editProfile: async (userData) => {
    const storedToken = await AsyncStorage.getItem('token');
    const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
    set({ isLoading: true });
    if(isNaN(userData.age)) {
      showToast({
              message: 'Please enter a valid age ',
              duration: 5000,
              type: 'warning',
              position: 'top',
              title: 'Invalid Age',
              animationType: 'slide',
              progressBar: true,
              richColors: true,
            })
      return;
    }
    try {
        const response = await fetch("https://rent-a-house-r0jt.onrender.com/api/v1/user/edit-info", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(userData), // Send the actual user data
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Failed to update profile");
        }
        
        set({ user: data.user, isLoading: false });
        AsyncStorage.setItem('user', JSON.stringify(data.user));
        // Alert.alert("Success", data.message);
         showToast({
              message: data.message,
              duration: 5000,
              type: 'error',
              position: 'top',
              title: 'Error',
              animationType: 'slide',
              progressBar: true,
              richColors: true,
            })
        
        showToast({
              message: data.message,
              duration: 5000,
              type: 'info',
              position: 'top',
              title: 'Information',
              animationType: 'slide',
              progressBar: true,
              richColors: true,
            })
        
    } catch (error) {
        set({ error: error.message, isLoading: false });
        // console.error("Error in updating User:", error.message);
        // Alert.alert("Error", error.message);
        showToast({
              message: error.message,
              duration: 5000,
              type: 'error',
              position: 'top',
              title: 'Error',
              animationType: 'slide',
              progressBar: true,
              richColors: true,
            })
    }
},
updateProfileImage: async (base64Image) => {
  set({isProfilePicUploaded: true})
  try {
    const storedToken = await AsyncStorage.getItem('token');
    const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;

    // First upload to Cloudinary
    const imageUrl = await uploadToCloudinary(base64Image);

    // Then send only the URL to your backend
    const response = await fetch("https://rent-a-house-r0jt.onrender.com/api/v1/user/edit-profile", {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageUrl.secure_url
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
     console.log("Error", `Server error: ${response.status} - ${errorData}`);
      return;
    }

    // Alert.alert("Success", "Profile image updated successfully");
    showToast({
              message: "Profile image updated successfully",
              duration: 5000,
              type: 'info',
              position: 'top',
              title: 'Information',
              animationType: 'slide',
              progressBar: true,
              richColors: true,
            })
    
  } catch (err) {
    console.log("Network error:", err.message);
    // Alert.alert("Error", `Network error: ${err.message}`);
     showToast({
              message: `Network error: ${err.message}`,
              duration: 5000,
              type: 'error',
              position: 'top',
              title: 'Error',
              animationType: 'slide',
              progressBar: true,
              richColors: true,
            })
    
  }finally{
    set({isProfilePicUploaded: false})
  }

},
getUserProfile:async(id)=>{
  const storedToken = await AsyncStorage.getItem('token');
  const token=storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
  set({isProfileLoading:true})

  try{
    const response=await fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/user/profile/${id}`,
      {  method:"GET",
        headers:{
            Authorization: `Bearer ${token}`,
        }}
    )
    const data=await response.json()
    if(!data.Profile){
      return;
    }
    set({isProfileLoading:false,userProfile:data.Profile})
  } catch(err){
        console.log(err.message)
        set({isProfileLoading:false,userProfile:null})

  }
  
},
  connectSocket: () => {
    const { user } = get();
    if (!user || get().socket?.connected) return;

    const socket = io("https://rent-a-house-r0jt.onrender.com", {
       reconnection: true, 
       transports: ["websocket"],
        query: { 
          userId: user._id, }, 
        }); socket.connect();
    
    set({ socket: socket });
    socket.on("connect", () => {
      // console.log("Socket connected", socket.id);
    })
    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // socket.on("disconnect", (reason) => 
    //   { 
    //     console.log("Socket disconnected:", reason);

    //    });
  },
  disconnectSocket: () => {
    const { socket } = get();
    if (get().socket?.connected) 
      console.log("Socket disconnected",socket?.id);
      get().socket.disconnect();
      set({ socket: null })
  },

}));