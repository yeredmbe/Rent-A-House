import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

export const notificationStore = create((set) => ({
    isLoading: false,
    notifications:[],
    notificationCount:0,
    getNotification:async (id) => {
         const storedToken = await AsyncStorage.getItem('token');
  const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
        set({ isLoading: true });
       const response = await fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/notification/notifications/${id}`, {
           method: "GET",
           headers: {
               "Content-Type": "application/json",
               "Authorization": `Bearer ${token}`
           }
       })
       const data = await response.json()
       set({ notifications: data.notifications, isLoading: false });
    },
    deleteNotification: async (id) => {

        const storedToken = await AsyncStorage.getItem('token');
        const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
        const response = await fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/notification/notifications/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
        const data = await response.json()
        console.log(data)
    },
    markAsRead: async (id) => {
        const storedToken = await AsyncStorage.getItem('token');
        const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
        const response = await fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/notification/notifications/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
        const data = await response.json()
        console.log(data)
    },
getNotificationCount: async (id) => {
    try {
        const storedToken = await AsyncStorage.getItem('token');
        const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
        
        set({ loading: true, error: null });
        
        const response = await fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/notification/notifications/count/${id}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        // Check if response is OK before parsing JSON
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Safely handle the response
        const count = data && typeof data.count === 'number' ? data.count : 0;
        
        set({ notificationCount: count, loading: false });
       // console.log("Notification count:", count);
        
    } catch (err) {
        console.error("Error fetching notification count:", err.message);
        set({ error: err.message, loading: false, notificationcount: 0 });
    }
}

    
}));

