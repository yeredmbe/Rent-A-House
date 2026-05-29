import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../Stores/authStore';
import icon from '../constant/icons';

/* ─── helpers ─────────────────────────────────────────── */
function formatNumber(n) {
  return Number(n)
    .toString()
    .split('')
    .reverse()
    .join('')
    .match(/.{1,3}/g)
    .join('.')
    .split('')
    .reverse()
    .join('');
}

/* ─── animated balloon ────────────────────────────────── */
function Balloon({ color, size, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 3000 + Math.random() * 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 3000 + Math.random() * 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '5deg'] });

  return (
    <Animated.View style={[style, { transform: [{ translateY }, { rotate }] }]}>
      <View
        style={{
          width: size,
          height: size * 1.2,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: 0.7,
        }}
      />
      <View
        style={{
          width: 1.5,
          height: 20,
          backgroundColor: color,
          alignSelf: 'center',
          opacity: 0.5,
        }}
      />
    </Animated.View>
  );
}

/* ─── coming soon card ────────────────────────────────── */
function ComingSoonCard() {
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // pulse ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(400),
      ])
    ).start();

    // gear spin
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // shimmer badges
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.3, 0] });
  const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const plans = ['Monthly', '3 months', '6 months'];

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 24,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#e0e7ff',
        overflow: 'hidden',
        backgroundColor: '#fff',
      }}
    >
      {/* animated stripe header */}
      <View style={{ height: 6, backgroundColor: '#124BCC', opacity: 0.15 }} />
      <View
        style={{
          height: 6,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#124BCC',
          opacity: 0.85,
        }}
      />

      <View style={{ padding: 20, alignItems: 'center', gap: 12 }}>
        {/* spinning gear with pulse ring */}
        <View style={{ width: 60, height: 60, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={{
              position: 'absolute',
              width: 60,
              height: 60,
              borderRadius: 30,
              borderWidth: 2,
              borderColor: '#124BCC',
              transform: [{ scale: ringScale }],
              opacity: ringOpacity,
            }}
          />
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#e8eeff',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Animated.Text
              style={{
                fontSize: 26,
                transform: [{ rotate: spinDeg }],
              }}
            >
              ⚙️
            </Animated.Text>
          </View>
        </View>

        <Text style={{ fontSize: 17, fontWeight: '500', color: '#124BCC', letterSpacing: 0.5 }}>
          Coming soon
        </Text>
        <Text style={{ fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 }}>
          More flexible plans are on the way.{'\n'}Stay tuned for shorter subscription options.
        </Text>

        {/* shimmer plan pills */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
          {plans.map((p, i) => (
            <Animated.View
              key={p}
              style={{
                backgroundColor: '#e8eeff',
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 6,
                opacity: shimmer,
              }}
            >
              <Text style={{ fontSize: 12, color: '#124BCC', fontWeight: '500' }}>{p}</Text>
            </Animated.View>
          ))}
        </View>

        {/* notify row */}
        <View
          style={{
            marginTop: 10,
            width: '100%',
            backgroundColor: '#f4f6ff',
            borderRadius: 10,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 16 }}>🔔</Text>
          <Text style={{ fontSize: 12, color: '#555', flex: 1 }}>
            Get notified when new plans launch
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              backgroundColor: '#124BCC',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}>Notify me</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/* ─── check icon ──────────────────────────────────────── */
function CheckIcon() {
  return (
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#e8eeff',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#124BCC', fontSize: 12, fontWeight: '700' }}>✓</Text>
    </View>
  );
}

/* ─── yearly plan card ────────────────────────────────── */
function YearlyCard({ role }) {
  const price = role === 'client' ? '35000' : '45000';
  const features = [
    'Unlimited property listings',
    'Priority support & visibility',
    'Advanced search filters',
    'Direct messaging with agents',
    'Full analytics dashboard',
  ];

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 20,
        borderWidth: 1.5,
        borderColor: '#124BCC',
        borderRadius: 16,
        backgroundColor: '#fff',
        shadowColor: '#124BCC',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <View style={{ padding: 18 }}>
        {/* header row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 }}>
          <View style={{ backgroundColor: '#e8eeff', borderRadius: 10, padding: 8 }}>
            <Text style={{ fontSize: 22 }}>🏠</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '500', color: '#124BCC' }}>Rent a house</Text>
            <Text style={{ fontSize: 12, color: '#888' }}>Yearly subscription</Text>
          </View>
          <View
            style={{
              backgroundColor: '#e8eeff',
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 4,
            }}
          >
            <Text style={{ fontSize: 12, color: '#124BCC', fontWeight: '500' }}>Save 30%</Text>
          </View>
        </View>

        {/* divider */}
        <View style={{ height: 0.5, backgroundColor: '#e0e7ff', marginBottom: 14 }} />

        {/* price row */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={{ fontSize: 32, fontWeight: '500', color: '#124BCC' }}>
                {formatNumber(price)}
              </Text>
              <Text style={{ fontSize: 14, color: '#124BCC' }}>XAF</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>
              per year · ~{formatNumber(Math.round(Number(price) / 12))} XAF/month
            </Text>
          </View>
          <View
            style={{
              backgroundColor: '#124BCC',
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 4,
            }}
          >
            <Text style={{ fontSize: 12, color: '#fff', fontWeight: '500' }}>1 year</Text>
          </View>
        </View>

        {/* features */}
        <View style={{ gap: 8, marginBottom: 18 }}>
          {features.map((f, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <CheckIcon />
              <Text style={{ fontSize: 13, color: '#333', flex: 1 }}>{f}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            backgroundColor: '#124BCC',
            borderRadius: 10,
            padding: 14,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '500' }}>Subscribe — 1 year</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ─── main screen ─────────────────────────────────────── */
const Payment = () => {
  const { user } = useStore();
  // Toggle this to switch between the two panels:
  // true  → shows the yearly plan card
  // false → shows the coming soon card
  const SHOW_ACTIVE_PLAN = true;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* floating balloons (background layer) */}
      <View style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Balloon color="#4f7fe8" size={26} style={{ position: 'absolute', top: 60, left: 14 }} />
        <Balloon color="#ff7eb3" size={22} style={{ position: 'absolute', top: 40, right: 14 }} />
        <Balloon color="#124BCC" size={32} style={{ position: 'absolute', top: '60%', left: '45%' }} />
        <Balloon color="#ffd166" size={20} style={{ position: 'absolute', top: '70%', right: 16 }} />
        <Balloon color="#ff7eb3" size={24} style={{ position: 'absolute', top: '40%', left: -4 }} />
      </View>

      {/* header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 14,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: user?.image_url ? 'transparent' : '#e8eeff',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            source={user?.image_url ? { uri: user.image_url } : icon.userr}
            style={
              user?.image_url
                ? { width: 40, height: 40, borderRadius: 20 }
                : { width: 22, height: 22, tintColor: '#124BCC' }
            }
            resizeMode="cover"
          />
        </TouchableOpacity>

        <Text style={{ fontSize: 18, fontWeight: '500', color: '#124BCC' }}>My Plans</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40, alignItems: 'center' }}>
        {/* ── Toggle: comment one block, keep the other ── */}

        {/* BLOCK A — active yearly plan */}
        {!SHOW_ACTIVE_PLAN && <YearlyCard role={user?.role} />}

        {/* BLOCK B — coming soon (comment out BLOCK A and set SHOW_ACTIVE_PLAN=false, or just render this directly) */}
        {SHOW_ACTIVE_PLAN && <ComingSoonCard />}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Payment;