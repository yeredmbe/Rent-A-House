import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthErrorModal } from '../../components/AuthErrorModal';
import CustomButton from '../../components/CustomButton';
import InputField from '../../components/InputField';
import { useStore } from '../../Stores/authStore';
import { getAuthError } from '../lib/AuthErrors';

const SignIn = () => {
  const { login, isLoading, isAuthenticated, user } = useStore();

  const [formData, setFormData] = useState({ email: '', password: '' });

  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  const [modal, setModal] = useState({ visible: false, title: '', message: '' });

  const router = useRouter();
  const { t } = useTranslation();

  const showError = (code) => {
    const { title, message } = getAuthError(code);
    setModal({ visible: true, title, message });
  };

  const onhandlelogin = async () => {
    if (isLoading) return;

    // ── Inline field validation ──────────────────────────────────────────────
    const errors = { email: '', password: '' };

    if (!formData.email) {
      errors.email = t('Email is required');
    } else if (!formData.email.includes('@')) {
      errors.email = t('Enter a valid email address');
    }

    if (!formData.password) {
      errors.password = t('Password is required');
    } else if (formData.password.length < 6) {
      errors.password = t('At least 6 characters');
    }

    if (errors.email || errors.password) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({ email: '', password: '' });

    // ── Call store ───────────────────────────────────────────────────────────
    try {
      await login(formData);
      setFormData({ email: '', password: '' });
    } catch (err) {
      // err.message should be one of the Convex error codes e.g. "WRONG_PASSWORD"
      showError(err?.message ?? 'UNKNOWN');
    }
  };

  useEffect(() => {
    if (user) {
      router.replace('/Home');
    }
  }, [user, router]);

  if (isAuthenticated) {
    return (
      <View className="bg-white w-full h-full items-center justify-center">
        <ActivityIndicator size="large" color="#124BCC" animating={isAuthenticated} />
        <Text className="mt-2 ">{t('Loading')}</Text>
      </View>
    );
  }

  return (
    <>
      {/* ── Error popup ───────────────────────────────────────────────────── */}
      <AuthErrorModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal((m) => ({ ...m, visible: false }))}
      />

      <SafeAreaView className="flex-1 bg-white">
        <KeyboardAvoidingView behavior="padding" className="h-full bg-white">
          <ScrollView
            className="h-full"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ justifyContent: 'center', alignItems: 'center' }}
          >
            <View className="h-28 android:h-20 mb-8" />

            <View className="flex-1 flex items-center justify-center my-3 mx-5">
              <View className="flex flex-col items-center justify-center">
                <Text className="font-bold text-2xl">{t('WelcomeBack')} </Text>
                <Text className="text-[#124BCC] my-3 font-bold text-5xl font-Churchillbold">
                  Rent A House
                </Text>
                <Text className="text-sm font-bold text-center font-Churchill">
                  {t('LoginToContinue')}
                </Text>
              </View>
            </View>

            <View className="flex w-full items-center justify-center mt-3 px-5">
              {/* Email */}
              <InputField
                label={t('Email')}
                placeholder={t('emailPlaceHolder')}
                styles="mx-2"
                value={formData.email}
                onTextChange={(text) => {
                  setFormData({ ...formData, email: text });
                  if (fieldErrors.email) setFieldErrors((e) => ({ ...e, email: '' }));
                }}
              />
              {!!fieldErrors.email && (
                <Text style={{ color: '#A32D2D', fontSize: 12, alignSelf: 'flex-start', marginLeft: 8, marginTop: 1, marginBottom: 6 }}>
                  {fieldErrors.email}
                </Text>
              )}

              {/* Password */}
              <InputField
                label={t('Password')}
                placeholder="********"
                styles="mx-2"
                value={formData.password}
                onTextChange={(text) => {
                  setFormData({ ...formData, password: text });
                  if (fieldErrors.password) setFieldErrors((e) => ({ ...e, password: '' }));
                }}
              />
              {!!fieldErrors.password && (
                <Text style={{ color: '#A32D2D', fontSize: 12, alignSelf: 'flex-start', marginLeft: 8, marginTop: 1, marginBottom: 6 }}>
                  {fieldErrors.password}
                </Text>
              )}

              <View className="flex justify-center items-center pt-5 flex-row gap-2">
                <Text className="text-lg text-black font-pregular">{t('DontHaveAccount')}</Text>
                <TouchableOpacity activeOpacity={0.8} onPress={() => router.replace('/SignUp')}>
                  <Text className="text-lg font-semibold text-[#124BCC] my-1">{t('SignUp')}</Text>
                </TouchableOpacity>
              </View>

              <CustomButton
                title={t('Login')}
                containerStyles="rounded-xl my-1 py-4"
                handlePress={onhandlelogin}
                isLoading={isLoading}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

export default SignIn;