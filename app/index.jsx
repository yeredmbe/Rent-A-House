import { Entypo } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Dimensions, FlatList, Image, Platform, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from '../Stores/authStore';

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: 0,
    src: require("../assets/images/House-searching-amico.png"),
    keyword: "Find",
    highlight: "Your Home",
  },
  {
    id: 1,
    src: require("../assets/images/House-searching-rafiki.png"),
    keyword: "Search",
    highlight: "Any Location",
  },
  {
    id: 2,
    src: require("../assets/images/House-searching-bro.png"),
    keyword: "Connect",
    highlight: "With Owners",
  },
  {
    id: 3,
    src: require("../assets/images/House-searching-pana.png"),
    keyword: "Move In",
    highlight: "With Confidence",
  },
];

export default function Index() {
  const { user, isLoading } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = React.useRef();
  const { t } = useTranslation();
  const hasNavigated = useRef(false);


  useEffect(() => {
    if (user && !hasNavigated.current) {
      hasNavigated.current = true;
      router.replace("/Home");
    }
  }, [user]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#124BCC" />
        <Text className="text-sm font-bold text-gray-500 mt-2">Loading...</Text>
      </SafeAreaView>
    );
  }

  const activeSlide = SLIDES[Number(currentIndex)] ?? SLIDES[0];

  return (
    <SafeAreaView className="flex-1 flex flex-col items-center bg-white">

      {/* ── Slide images ── */}
      <View className="w-full h-3/4">
        <FlatList
          ref={scrollRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => {
            setCurrentIndex(
              (event.nativeEvent.contentOffset.x / width).toFixed(0)
            );
          }}
          renderItem={({ item }) => (
            <View style={{ width }} className="h-full items-center justify-center">
              <Image source={item.src} className="w-full h-full" resizeMode="contain" />
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
        />
      </View>

      {/* ── Keywords ── */}
      <View className="items-center mt-6">
        <Text className="text-3xl font-bold text-center">
          <Text className="text-gray-900">{t(activeSlide.keyword)} </Text>
          <Text className="text-[#124BCC]">{t(activeSlide.highlight)}</Text>
        </Text>
      </View>

      {/* ── Dot indicators ── */}
       <View className={`flex-row ${Platform.OS === 'android' ? 'my-5 ' : 'my-4'}`}>
        {SLIDES.map((item, index) => (
          <View
            key={item.id}
            className={`${currentIndex == item.id ? "w-8 h-4" : "size-4"} ${currentIndex == item.id ? "bg-[#124BCC]" : "bg-gray-400"} mx-1 mb-12 rounded-full`}
          />
        ))}
      </View>

      {/* ── Continue button (last slide only) ── */}
      {currentIndex === (SLIDES.length - 1).toString() && (
        <TouchableOpacity onPress={() => router.push("/(auth)/SignUp")} activeOpacity={0.7} className=" flex flex-row items-center justify-start bg-[#124BCC] rounded-lg px-5 py-2 absolute bottom-12 right-9">
          <Text className="text-white">{t("Continue")}</Text>
          <Entypo name="chevron-right" size={30} color="white" />
        </TouchableOpacity>
      )}


    </SafeAreaView>
  );
}