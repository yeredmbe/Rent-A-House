import { Entypo } from '@expo/vector-icons'
import { Slider } from '@miblanchard/react-native-slider'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import DropdownInput from "../components/SelectInput"
import icon from '../constant/icons'
import image from '../constant/image'
import { useStore } from '../Stores/authStore'
import { homeStore } from '../Stores/homeStore'
import { messageStore } from '../Stores/messageStore'





const Search = () => {
  const [Category, setCategory] = useState("All")
  const [filters,setFilters]=useState({
    minPrice:5000,
    maxPrice:"",
    category:"",
    region:""
  })
  const [isLoading,setIsLoading]=useState(true)
  const [count,setCount]=useState(0)
  const { filteredHomes,filterCount,getHouseOnFilter,loading } = homeStore();
  const {countmessages}=messageStore()
  const { user, getUser } = useStore()
  const { t } = useTranslation()
  useEffect(() => {
    getUser();
  }, [])


  const getCount = async () => {
   setCount(await countmessages())
    console.log("...........count",count)
  }
  useEffect(()=>{
    getCount()
  },[])

   // Apply filters when component mounts or filters change
  useEffect(() => {
    handleFilter();
  }, [Category]); // Re-filter when category changes

     const Categories =  [
    { label: t('House'), value: 'House' },
    { label: t('Apartment'), value: 'Apartment' },
    { label: t('Villa'), value: 'Villa' },
    { label: t('Office'), value: 'Office' },
    { label: t("Studio"), value: "Studio" },
    { label: t("Townhouse"), value: "Townhouse" },
    { label: t("Penthouse"), value: "Penthouse" },
    { label: t("Duplex"), value: "Duplex" },
    { label: t("Bungalow"), value: "Bungalow" },
    { label: t("Cottage"), value: "Cottage" },
    { label: t("Mansion"), value: "Mansion" },
    { label: t("Room"), value: "Room" },
    {label:t("Store"), Value:"Store"}
  ];
  
  const data=[{ label: 'All', value: 'All' },
    { label: 'Location', value: 'Location' },
    { label: 'Price', value: 'Price' },]

  const handleFilter = async () => {
    try {
      const filter={
        minPrice:filters.minPrice,
        maxPrice:filters.maxPrice,
        category:filters.category,
        region:filters.region,
      }
      await getHouseOnFilter(filters);
      setFilters({
        minPrice:5000,
        maxPrice:"",
        category:"",
        region:""
      })

    } catch (err) {
      console.error('Filter error:', err);
    }
  };

  // Update the filter button to call handleFilter
  const applyFilter = () => {
    handleFilter();
  };

  function formatNumber(number) {
  // Convert to string and split into integer and decimal parts
  const numStr = Number(number).toString();
  let integerPart = numStr;
  // Format integer part with dots as thousands separators
  const formattedInteger = integerPart
    .split('')
    .reverse()
    .join('')
    .match(/.{1,3}/g)
    .join('.')
    .split('')
    .reverse()
    .join('');

  return formattedInteger;
}
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className='flex flex-row items-center justify-between p-2 mx-3'>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/Profile")} className={`size-10 rounded-full ${user?.image_url ? "" : "bg-gray-200 "}items-center justify-center`}>
          <Image source={user?.image_url ? { uri: user?.image_url } : icon.userr} className={`${user?.image_url ? "size-10 rounded-full" : "size-6"}`} tintColor={user?.image_url ? "" : '#124BCC'} resizeMode='cover' />
        </TouchableOpacity>

     { Category === "All" ?<TextInput
          placeholder={t('SearchLocation')}
          returnKeyType="search"
          placeholderTextColor={'gray'}
          value={filters.region}
          onChangeText={(text) => setFilters({ ...filters, region: text })}
          className='border border-gray-200 rounded-full p-2 w-72' />:
          Category==="Location" && <TextInput
          placeholder={t('SearchLocation')}
          returnKeyType="search"
          placeholderTextColor={'gray'}
          value={filters.region}
          onChangeText={(text) => setFilters({ ...filters, region: text })}
          className='border border-gray-200 rounded-full p-2 w-72' />}
<View className='flex relative'>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/Message")}>
          <Entypo name="message" size={28} color="gray" />
        </TouchableOpacity>
        
          {count > 0 && <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/Message")} className="absolute -top-1 right-0 bg-[red] rounded-full py-1 px-[5px] max-w-9 flex flex-row items-center justify-center">
            <Text className="text-white text-center text-xs ">{count > 10 ? "9+": count}</Text>
          </TouchableOpacity>}
       
        </View>
      </View>
      {Category === "All" ? <View className="px-6">
        <Slider
          value={filters.minPrice}
          onValueChange={value => setFilters({ ...filters, minPrice: value })}
          minimumValue={5000}
          maximumValue={1000000}
          minimumTrackTintColor="#124BCC"
          maximumTrackTintColor="gray"
          thumbTintColor="#124BCC"
          step={500}
        />

        <Text className="font-bold text-gray-500">{t("minimumPrice")} {filters.minPrice}</Text>

        <Slider
          value={filters.maxPrice}
          onValueChange={value => setFilters({ ...filters, maxPrice: value })}
          minimumValue={5000}
          maximumValue={10000000}
          minimumTrackTintColor="#124BCC"
          maximumTrackTintColor="gray"
          thumbTintColor="#124BCC"
          step={500}
        />

        <Text className="font-bold text-gray-500"> {t("maximumPrice")} {filters.maxPrice}</Text>
        {Category === "All" && <View className=" w-full flex flex-row items-center justify-between">
          <View className="flex-1">
          <DropdownInput
            data={Categories}
            value={filters.category}
            onChange={(item) => setFilters({ ...filters, category: item.value })}
            placeholder={t("Select category")}
            style={'border border-gray-200 rounded-full p-1 my-1 w-72'}
          />
          <Text className="font-bold text-gray-500"> {t("Category")} : {filters.category}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={applyFilter} className={` bg-[#124BCC] items-center justify-center py-4 px-4 mx-3 rounded-md  mb-4`} >
              <Image source={icon.setting} className="size-6" tintColor={"#ffffff"}/>
          </TouchableOpacity>
        </View>} 
        {/* { Category === "Category" &&
        <View className=" w-full flex flex-row items-center justify-between">
          <DropdownInput
            data={Categories}
            value={filters.category}
            onChange={(item) => setFilters({ ...filters, category: item.value })}
            placeholder="Select category"
            style={'border border-gray-200 rounded-full p-1 my-1 w-72'}
          />
          <Text className="font-bold text-gray-500"> Catergory : {filters.category}</Text>
        </View>} */}

      </View> : Category==="Price" &&
      <View className="px-6">
       <Slider
          value={filters.minPrice}
          onValueChange={value => setFilters({ ...filters, minPrice: value })}
          minimumValue={5000}
          maximumValue={1000000}
          minimumTrackTintColor="#124BCC"
          maximumTrackTintColor="gray"
          thumbTintColor="#124BCC"
          step={500}
        />

        <Text className="font-bold text-gray-500">{t("minimumPrice")} {filters.minPrice}</Text>

        <Slider
          value={filters.maxPrice}
          onValueChange={value => setFilters({ ...filters, maxPrice: value })}
          minimumValue={5000}
          maximumValue={1000000}
          minimumTrackTintColor="#124BCC"
          maximumTrackTintColor="gray"
          thumbTintColor="#124BCC"
          step={500}
        />

        <Text className="font-bold text-gray-500"> {t("maximumPrice")}: {filters.maxPrice}</Text>
        </View>}
      <View className='w-full'>
        <FlatList
          className="m-3"
          data={data} //search by category should be present but due to bugs i commented not to forget about it      
          renderItem={({ item, index }) => {
            return (
              <TouchableOpacity onPress={() => {setCategory(item.value)
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
              }} activeOpacity={0.7} className={`${Category === item.value ? "bg-[#124BCC]" : "bg-gray-200"}  h-10 items-center justify-center px-4 mx-3 rounded-full`} >
                <Text className={`${Category === item.value ? "text-white" : "text-black"} font-bold `}>{t(item.label)}</Text>
              </TouchableOpacity>
            )
          }}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index}
        />
        {Category !== "All"  && <TouchableOpacity activeOpacity={0.7} onPress={applyFilter} className={` bg-[#124BCC] flex flex-row items-center justify-center py-4 px- mx-8 rounded-md  mb-4`} >
          <Image source={icon.filter} className="size-6 mr-2" tintColor={"#ffffff"}/>  
              <Text className={`text-white font-bold `}>Filter based on {Category}</Text>
          </TouchableOpacity>}
      </View>
      <View className='w-full'>
       {loading? <View className="w-full items-center justify-center my-5 p-4">
        <View className="flex-1 items-center my-5 justify-center" />
           <ActivityIndicator size="large" color="#124BCC" />
                <Text className="text-sm text-gray-500 mt-2">{t("Loading")}</Text>
       </View>: <FlatList
          data={filteredHomes}
          className="mx-2 bg-gray-100 h-full"
          renderItem={({ item }) => {
            return (
              <TouchableOpacity onPress={() => router.push(`/House/${item._id}`)} activeOpacity={0.7} className='flex flex-row items-center bg-white p-3 rounded-lg shadow-sm shadow-gray-400 justify-between mx-2 my-1'>
                <View className="w-full flex flex-row justify-between items-center ">
                  <Image source={isLoading ? image.loader : { uri: item.home_cover }}
                   className='w-28 h-20 rounded-lg '
                    resizeMethod='contain'
                    onLoadEnd={() => setIsLoading(false)} />
                  <View className="flex flex-col justify-between items-end px-3">
                    <Text className="text-black font-bold text-xl  ">{item.address}</Text>
                    <Text className="text-black text-md  ">{item.category}</Text>
                    <Text className="text-black text-lg  ">{formatNumber(item.price)} XAF</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )
          }}
          ListEmptyComponent={() => {
            return (
              <View className='flex flex-col items-center justify-center h-full'>
                <View className="flex flex-row items-center justify-center h-20" />
                <Image source={icon.result} className="size-72 my-8" tintColor={"#d1d5db"} />
                <Text className="text-5xl font-bold text-[#d1d5db] text-center">{t("No Result Found")}</Text>
              </View>
            )
          }}
          keyExtractor={(item) => item._id}
        />}
      </View>
    </SafeAreaView>
  )
}

export default Search