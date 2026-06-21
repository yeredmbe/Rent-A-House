import { Entypo } from '@expo/vector-icons'
import { Slider } from '@miblanchard/react-native-slider'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import DropdownInput from "../components/SelectInput"
import icon from '../constant/icons'
import { api } from "../convex/_generated/api"
import { useCachedQuery } from '../hooks/useCachedQuery'
import { useStore } from '../Stores/authStore'

const Categories = [
  { label: 'House', value: 'House' },
  { label: 'Apartment', value: 'Apartment' },
  { label: 'Villa', value: 'Villa' },
  { label: 'Office', value: 'Office' },
  { label: 'Studio', value: 'Studio' },
  { label: 'Townhouse', value: 'Townhouse' },
  { label: 'Penthouse', value: 'Penthouse' },
  { label: 'Duplex', value: 'Duplex' },
  { label: 'Bungalow', value: 'Bungalow' },
  { label: 'Cottage', value: 'Cottage' },
  { label: 'Mansion', value: 'Mansion' },
  { label: 'Room', value: 'Room' },
]

function formatNumber(number) {
  const numStr = Number(number).toString()
  return numStr.split('').reverse().join('').match(/.{1,3}/g).join('.').split('').reverse().join('')
}

const FILTER_TABS = ["All", "Location", "Price"]
const EMPTY_FILTERS = { minPrice: 5000, maxPrice: "", category: "", searchQuery: "" }
const DEBOUNCE_MS = 400

const Search = () => {
  const [activeTab, setActiveTab] = useState("All")
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  // debouncedFilters is what actually gets sent to Convex
  const [debouncedFilters, setDebouncedFilters] = useState(EMPTY_FILTERS)
  const debounceRef = useRef(null)
  const { t } = useTranslation()
  const { user } = useStore()

  // Debounce: whenever filters change, wait DEBOUNCE_MS then push to debouncedFilters
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedFilters({ ...filters })
    }, DEBOUNCE_MS)
    return () => clearTimeout(debounceRef.current)
  }, [filters])

  // When tab changes, reset everything immediately (no debounce needed)
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setFilters(EMPTY_FILTERS)
    setDebouncedFilters(EMPTY_FILTERS)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
  }

  const searchResult = useCachedQuery(
    api.homes.filterHomes,
    {
      minPrice: Number(debouncedFilters.minPrice) || 5000,
      maxPrice: Number(debouncedFilters.maxPrice) || undefined,
      category: debouncedFilters.category || undefined,
      searchQuery: debouncedFilters.searchQuery.trim() || undefined,
    },
    `cache_search_${debouncedFilters.minPrice}_${debouncedFilters.maxPrice}_${debouncedFilters.category}_${debouncedFilters.searchQuery}`
  )
  const filteredHomes = searchResult?.homes ?? []
  const loading = searchResult === undefined

  const count = useCachedQuery(
    api.messages.countUnreadMessages,
    user?._id ? { userId: user._id } : "skip",
    `cache_unread_count_${user?._id}`
  ) ?? 0

  return (
    <SafeAreaView className="flex-1 bg-white">

      {/* ── Top bar ── */}
      <View className="flex flex-row items-center justify-between p-2 mx-3">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/Profile")}
          className={`size-10 rounded-full ${user?.image_url ? "" : "bg-gray-200"} items-center justify-center`}
        >
          <Image
            source={user?.image_url ? { uri: user.image_url } : icon.userr}
            className={user?.image_url ? "size-10 rounded-full" : "size-6"}
            tintColor={user?.image_url ? "" : '#124BCC'}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {(activeTab === "All" || activeTab === "Location") && (
          <View className="flex-1 mx-3">
            <TextInput
              placeholder="Search by location, address..."
              returnKeyType="search"
              placeholderTextColor="gray"
              value={filters.searchQuery}
              onChangeText={(text) => setFilters({ ...filters, searchQuery: text })}
              // No onSubmitEditing needed — debounce handles it automatically
              className="border border-gray-200 rounded-full p-2"
            />
          </View>
        )}

        <View className="flex relative">
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/Message")}>
            <Entypo name="message" size={28} color="gray" />
            {count > 0 && (
              <View className="absolute -top-1 right-0 bg-red-500 rounded-full py-1 px-[5px] max-w-9 flex flex-row items-center justify-center">
                <Text className="text-white text-center text-xs">{count > 10 ? "9+" : count}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Filter controls ── */}
      {(activeTab === "All" || activeTab === "Price") && (
        <View className="px-6">
          <Slider
            value={filters.minPrice}
            onValueChange={value => setFilters({ ...filters, minPrice: Array.isArray(value) ? value[0] : value })}
            minimumValue={5000}
            maximumValue={1000000}
            minimumTrackTintColor="#124BCC"
            maximumTrackTintColor="gray"
            thumbTintColor="#124BCC"
            step={500}
          />
          <Text className="font-bold text-gray-500">{t("minimumPrice")} {formatNumber(filters.minPrice)}</Text>

          <Slider
            value={filters.maxPrice || 5000}
            onValueChange={value => setFilters({ ...filters, maxPrice: Array.isArray(value) ? value[0] : value })}
            minimumValue={5000}
            maximumValue={1000000}
            minimumTrackTintColor="#124BCC"
            maximumTrackTintColor="gray"
            thumbTintColor="#124BCC"
            step={500}
          />
          <Text className="font-bold text-gray-500">{t("maximumPrice")} {formatNumber(filters.maxPrice)}</Text>

          {activeTab === "All" && (
            <View className="w-full flex flex-row items-center justify-between">
              <View className="flex-1">
                <DropdownInput
                  data={Categories}
                  value={filters.category}
                  onChange={(item) => setFilters({ ...filters, category: item.value })}
                  placeholder="Select category"
                  style="border border-gray-200 rounded-full p-1 my-1 w-72"
                />
                <Text className="font-bold text-gray-500">{t("Category")} {filters.category}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ── Tab bar ── */}
      <View className="w-full">
        <FlatList
          className="m-3"
          data={FILTER_TABS}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleTabChange(item)}
              activeOpacity={0.7}
              className={`${activeTab === item ? "bg-[#124BCC]" : "bg-gray-200"} h-10 items-center justify-center px-4 mx-3 rounded-full`}
            >
              <Text className={`${activeTab === item ? "text-white" : "text-black"} font-bold`}>{item}</Text>
            </TouchableOpacity>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
        />
      </View>

      {/* ── Results list ── */}
      <View className="w-full flex-1">
        {loading ? (
          <View className="flex-1 items-center justify-center my-5 p-4">
            <ActivityIndicator size="large" color="#124BCC" />
            <Text className="text-sm text-gray-500 mt-2">{t("Loading")}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredHomes}
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push(`/House/${item._id}`)}
                activeOpacity={0.85}
                className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-gray-300"
              >
                <View className="relative">
                  <Image
                    source={{ uri: item.home_cover }}
                    className="w-full h-48"
                    resizeMode="cover"
                  />
                  <View className="absolute top-3 left-3 bg-white/90 px-3 py-1 rounded-full">
                    <Text className="text-xs font-semibold text-[#124BCC]">{item.category}</Text>
                  </View>
                </View>

                <View className="p-4 flex-row items-center justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
                      {item.address}
                    </Text>
                    <Text className="text-xs text-gray-400 mt-0.5">{t("ListedProperty")}</Text>
                  </View>
                  <View className="bg-[#124BCC] px-3 py-2 rounded-xl">
                    <Text className="text-white text-sm font-bold">{formatNumber(item.price)} XAF</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View className="flex-1 items-center justify-center mt-24 px-8">
                <Image source={icon.result} className="w-36 h-36" tintColor="#e5e7eb" />
                <Text className="text-2xl font-bold text-gray-200 text-center mt-6">{t("NoResult")}</Text>
                <Text className="text-sm text-gray-300 text-center mt-2">{t("TryAdjustingSearch")}</Text>
              </View>
            )}
            keyExtractor={(item) => item._id}
          />
        )}
      </View>

    </SafeAreaView>
  )
}

export default Search