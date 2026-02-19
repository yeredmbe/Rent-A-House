import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from 'zustand';
import uploadToCloudinary from "../app/lib/uploadToCloudinary";
import { useStore } from "./authStore";

const CACHE_KEYS = {
    messages: (id) => `cached_messages_${id}`,
    chatUsers: 'cached_chat_users',
};

export const messageStore = create((set,get) => ({
    isLoading:false,
    users:[],
    messages:[],
    chatUsers:[],
    selectedUser:null,
 sendMessage: async (id, msg) => {
    const storedToken = await AsyncStorage.getItem('token');
    const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
    set({ isLoading: true });
    
    try {
        let secure_url = "";
        
        // Only upload to Cloudinary if there's an image
        if (msg.image_url) {
            const value = await uploadToCloudinary(msg.image_url);
            secure_url = value.secure_url;
        }
        
        // Create the payload with only the properties that exist
        const payload = {
            ...(msg.text && { text: msg.text }),
            ...(secure_url && { image_url: secure_url })
        };
        
        const res = await fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/message/send-message/${id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (res.ok) {
            const data = await res.json();
            const updatedMessages = [...get().messages, data.newMessage];
            set({ messages: updatedMessages, isLoading: false });
            // Update cache with new message included
            await AsyncStorage.setItem(CACHE_KEYS.messages(id), JSON.stringify(updatedMessages));
        } else {
            // Handle non-OK responses
            const errorData = await res.json();
            console.log("Server error:", errorData);
            set({ isLoading: false });
            // You might want to show an error toast here
        }
    } catch (error) {
        console.log("Network error:", error);
        set({ isLoading: false });
        // You might want to show an error toast here
    }
},
   getMessages:async(id)=>{
        const storedToken = await AsyncStorage.getItem('token');
         const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;

        // Load cache immediately so UI renders without waiting
        const cached = await AsyncStorage.getItem(CACHE_KEYS.messages(id));
        if (cached) {
            set({ messages: JSON.parse(cached) });
        }

        // Only show spinner if there's no cached data
        set({ isLoading: !cached });

        try {
            const res = await fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/message/get-messages/${id}`,{
                method:"GET",
                headers:{
                    "Content-Type":"application/json",
                    "Authorization":`Bearer ${token}`
                }
            })
            if(res.ok){
                const data = await res.json()
                set({messages:data.Messages,isLoading:false})
                await AsyncStorage.setItem(CACHE_KEYS.messages(id), JSON.stringify(data.Messages));
            }else {
  const errorData = await res.json();
//   Alert.alert("Error", errorData.message || "Failed to send message");
}
        } catch (error) {
            set({messages:[],isLoading:false})
            console.log(error.message)
        }
                },
    getChatUsers:async()=>{
         const storedToken = await AsyncStorage.getItem('token');
         const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;

        // Load cache immediately
        const cached = await AsyncStorage.getItem(CACHE_KEYS.chatUsers);
        if (cached) {
            set({ chatUsers: JSON.parse(cached) });
        }

        // Only show spinner if there's no cached data
        set({ isLoading: !cached });

        try {
            const res = await fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/message/`,{
                method:"GET",
                headers:{
                    "Content-Type":"application/json",
                    "Authorization":`Bearer ${token}`
                }
            })
            if(res.ok){
                const data = await res.json()
                set({chatUsers:data.favorites,isLoading:false})
                await AsyncStorage.setItem(CACHE_KEYS.chatUsers, JSON.stringify(data.favorites));
            }
        } catch (error) {
            set({chatUsers:null,isLoading:false})
            console.log(error.message)
        }
                },
    
        messageIsRead:async(id)=>{
        const storedToken = await AsyncStorage.getItem('token');
         const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
        set({isLoading:true})
        try {
            const res = await fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/message/is-read/${id}`,{
                method:"PUT",
                headers:{
                    "Content-Type":"application/json",
                    "Authorization":`Bearer ${token}`
                }
            })
            if(res.ok){
                const data = await res.json()
                set({messages:data.message,isLoading:false})
                console.log(data.message)
            }
        } catch (error) {
            set({messages:null,isLoading:false})
            console.log(error.message)
        }
                
        },
        countmessages: async () => {
            const storedToken = await AsyncStorage.getItem('token');
            const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
            try {
                const res = await fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/message/count-messages`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    return data.count;
                } else {
                    return 0;
                }
            } catch (error) {
                console.error("Network error:", error);
                return 0;
            }
        },
        setSelectedUser: (user) => set({ selectedUser: user }),
        subscribeToMessages: () => {
            const { selectedUser } = get();
            if (!selectedUser) return;
    
            const socket = useStore.getState().socket;
    
            socket.on("newMessage", (newMessage) => {
                const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
                if (!isMessageSentFromSelectedUser) return;
    
                set({
                    messages: [...get().messages, newMessage],
                });
            });
        },
        unsuscribeToMessages: () => {
            const socket = useStore.getState().socket;
            socket.off("newMessage");
        },
        toggleReadMessages:async(id)=>{
            const storedToken =await AsyncStorage.getItem('token');
            const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
            fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/message/is-read/${id}`,{
                method:"PUT",
                headers:{
                    "Content-Type":"application/json",
                    "Authorization":`Bearer ${token}`
                }
            }).then(res=>res.json()).then(data=>{
                console.log(data.message," messages marked as read")
            }).catch(err=>{ console.log(err.message)})
        }
    })
    );