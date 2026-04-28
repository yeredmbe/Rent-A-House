import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

type Props = {
    visible: boolean;
    title: string;
    message: string;
    onClose: () => void;
};

export const AuthErrorModal = ({ visible, title, message, onClose }: Props) => (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
        <Pressable
            onPress={onClose}
            style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.45)',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
            }}
        >
            <Pressable
                style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 24,
                    width: '100%',
                    alignItems: 'center',
                    gap: 12,
                }}
            >
                <View
                    style={{
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        backgroundColor: '#FCEBEB',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 4,
                    }}
                >
                    <Text style={{ fontSize: 24, color: '#A32D2D', fontWeight: '700' }}>!</Text>
                </View>

                <Text style={{ fontSize: 17, fontWeight: '600', color: '#111', textAlign: 'center' }}>
                    {title}
                </Text>

                <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 }}>
                    {message}
                </Text>

                <TouchableOpacity
                    onPress={onClose}
                    activeOpacity={0.8}
                    style={{
                        backgroundColor: '#124BCC',
                        borderRadius: 10,
                        paddingVertical: 13,
                        width: '100%',
                        marginTop: 4,
                    }}
                >
                    <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600', fontSize: 15 }}>
                        Got it
                    </Text>
                </TouchableOpacity>
            </Pressable>
        </Pressable>
    </Modal>
);