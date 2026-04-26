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
import { api } from "../convex/_generated/api"
import { useCachedQuery } from '../hooks/useCachedQuery'
import { useStore } from '../Stores/authStore'

// FIX: exhaustive list of regions accepted by the Convex filterHomes validator.
// Any free-text input that does not match one of these (case-insensitive) is
// sent as undefined so Convex never receives an invalid literal value.
const ALLOWED_REGIONS = [
  "Bafoussam", "Douala", "Yaounde", "Buea", "Bamenda",
  "Garoua", "Maroua", "Ngaoundere", "Adamawa", "Bertoua"
]

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
  return numStr
    .split('').reverse().join('')
    .match(/.{1,3}/g)
    .join('.')
    .split('').reverse().join('')
}

const FILTER_TABS = ["All", "Location", "Price"]

const EMPTY_FILTERS = { minPrice: 5000, maxPrice: "", category: "", region: "" }

const Search = () => {
  const [activeTab, setActiveTab] = useState("All")
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS)
  const [mounted, setMounted] = useState(false)
  const { t } = useTranslation()
  const { user } = useStore()

  // FIX: resolve the raw region text to a valid literal before querying.
  // If the user typed something that does not match, pass undefined so Convex
  // does not receive an invalid value and throw ArgumentValidationError.
  const resolveRegion = (raw) => {
    if (!raw?.trim()) return undefined
    return ALLOWED_REGIONS.find(
      r => r.toLowerCase() === raw.trim().toLowerCase()
    ) ?? undefined
  }

  const regionHint = filters.region.length > 1
    ? ALLOWED_REGIONS.filter(r =>
      r.toLowerCase().startsWith(filters.region.toLowerCase().slice(0, 3))
    ).slice(0, 4)
    : []

  const regionIsInvalid =
    filters.region.trim().length > 0 && !resolveRegion(filters.region)

  const searchResult = useCachedQuery(
    api.homes.filterHomes,
    {
      minPrice: Number(appliedFilters.minPrice),
      maxPrice: Number(appliedFilters.maxPrice) || undefined,
      category: appliedFilters.category || undefined,
      region: resolveRegion(appliedFilters.region),
    },
    `cache_search_${appliedFilters.minPrice}_${appliedFilters.maxPrice}_${appliedFilters.category}_${appliedFilters.region}`
  )

  const filteredHomes = searchResult?.homes ?? []
  const loading = searchResult === undefined

  const count = useCachedQuery(
    api.messages.countUnreadMessages,
    user?._id ? { userId: user._id } : "skip",
    `cache_unread_count_${user?._id}`
  ) ?? 0

  useEffect(() => {
    if (!mounted) { setMounted(true); return }
    applyFilter()
  }, [activeTab])

  const applyFilter = () => {
    setAppliedFilters({
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      category: filters.category,
      region: filters.region,
    })
    setFilters(EMPTY_FILTERS)
  }

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
              placeholder="Search for a location..."
              returnKeyType="search"
              placeholderTextColor="gray"
              value={filters.region}
              onChangeText={(text) => setFilters({ ...filters, region: text })}
              onSubmitEditing={applyFilter}
              className={`border ${regionIsInvalid ? "border-blue-300" : "border-gray-200"} rounded-full p-2`}
            />
            {/* Inline suggestion hints */}
            {regionHint.length > 0 && regionIsInvalid && (
              <View className="flex-row flex-wrap mt-1 ml-2 gap-1">
                {regionHint.map(r => (
                  <TouchableOpacity
                    key={r}
                    activeOpacity={0.7}
                    onPress={() => {
                      setFilters({ ...filters, region: r })
                    }}
                    className="bg-blue-50 px-2 py-0.5 rounded-full"
                  >
                    <Text className="text-xs text-[#124BCC] font-semibold">{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {regionIsInvalid && regionHint.length === 0 && (
              <Text className="text-xs text-blue-400 ml-3 mt-1">
                {t("validRegions")}: {ALLOWED_REGIONS.join(', ')}
              </Text>
            )}
          </View>
        )}

        <View className="flex relative">
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/Message")}>
            <Entypo name="message" size={28} color="gray" />
          </TouchableOpacity>
          {count > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/Message")}
              className="absolute -top-1 right-0 bg-red-500 rounded-full py-1 px-[5px] max-w-9 flex flex-row items-center justify-center"
            >
              <Text className="text-white text-center text-xs">{count > 10 ? "9+" : count}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filter controls ── */}
      {(activeTab === "All" || activeTab === "Price") && (
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
          <Text className="font-bold text-gray-500">{t("minimumPrice")} {formatNumber(filters.minPrice)}</Text>

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
          <Text className="font-bold text-gray-500">{t("maximumPrice")}: {formatNumber(filters.maxPrice)}</Text>

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
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={applyFilter}
                className="bg-[#124BCC] items-center justify-center py-4 px-4 mx-3 rounded-md mb-4"
              >
                <Image source={icon.setting} className="size-6" tintColor="#ffffff" />
              </TouchableOpacity>
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
              onPress={() => {
                setActiveTab(item)
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
              }}
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

        {activeTab !== "All" && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={applyFilter}
            className="bg-[#124BCC] flex flex-row items-center justify-center py-4 mx-8 rounded-md mb-4"
          >
            <Image source={icon.filter} className="size-6 mr-2" tintColor="#ffffff" />
            <Text className="text-white font-bold">{t("Filter")} {activeTab}</Text>
          </TouchableOpacity>
        )}
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
            className="mx-2 bg-gray-100 h-full"
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push(`/House/${item._id}`)}
                activeOpacity={0.7}
                className="flex flex-row items-center bg-white p-3 rounded-lg shadow-sm shadow-gray-400 justify-between mx-2 my-1"
              >
                <View className="w-full flex flex-row justify-between items-center">
                  <Image
                    source={{ uri: item.home_cover }}
                    className="w-28 h-20 rounded-lg"
                    resizeMode="cover"
                  />
                  <View className="flex flex-col justify-between items-end px-3">
                    <Text className="text-black font-bold text-xl">{item.address}</Text>
                    <Text className="text-black text-md">{item.category}</Text>
                    <Text className="text-black text-lg">{formatNumber(item.price)} XAF</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View className="flex flex-col items-center justify-center h-full">
                <View className="flex flex-row items-center justify-center h-20" />
                <Image source={icon.result} className="size-44 my-8" tintColor="#d1d5db" />
                <Text className="text-3xl text-center font-bold text-[#d1d5db]">{t("NoResult")}</Text>
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