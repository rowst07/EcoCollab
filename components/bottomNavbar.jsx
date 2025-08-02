import { Feather } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BottomNavbar() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { name: 'Home', icon: 'home', route: '/UserScreens/homeUser' },
    { name: 'Retomas', icon: 'refresh-ccw', route: '/UserScreens/retomas' },
    { name: 'Perfil', icon: 'user', route: '/SharedScreens/perfil' },
  ];

  return (
    <View style={styles.wrapper}>
      {tabs.map((tab, index) => {
        const isActive = pathname === tab.route;
        return (
          <TouchableOpacity
            key={index}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => router.push(tab.route)}
          >
            <Feather
              name={tab.icon}
              size={24}
              color="#fff"
            />
            <Text style={styles.label}>{tab.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 18,
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
  },
  tab: {
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#256a28',
  },
  label: {
    fontSize: 13,
    color: '#fff',
    marginTop: 4,
    fontWeight: '500',
  },
});
