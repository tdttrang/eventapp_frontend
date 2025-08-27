// tabs/index.js
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState, useRef } from 'react';
import { 
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import moment from 'moment';
import 'moment/locale/vi';
import { authApi } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

// Thay đổi này là đúng, bạn đang nối URL tương đối của Cloudinary
const CLOUD_BASE_URL = 'https://res.cloudinary.com/dachbxwws/'; 

// ===== Styles =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15, // Đảm bảo padding không bị ảnh hưởng bởi FlatList
    backgroundColor: '#fface8',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logo: {
    width: 120,
    height: 30,
    resizeMode: 'contain',
  },
  sectionHeader: { // Style cho phần tiêu đề có thêm nút cuộn
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bannerBig: {
    position: 'relative',
    width: screenWidth,
    height: 200,
  },
  bannerBigImage: {
    width: '100%',
    height: '100%',
  },
  bannerBigButton: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bannerBigButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  eventCard: {
    width: 150,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2, // shadow for Android
  },
  eventImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  eventInfo: {
    padding: 8,
  },
  eventName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  eventDate: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  eventLocation: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  eventItem: {
    flexDirection: 'row',
    marginVertical: 8,
    marginHorizontal: 10, // Áp dụng margin cho từng item thay vì cho FlatList
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  eventItemImage: {
    width: 100,
    height: 100,
  },
  eventItemText: {
    flex: 1,
    padding: 8,
  },
  eventItemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventItemDate: {
    fontSize: 14,
    color: '#555',
  },
  eventItemLocation: {
    fontSize: 14,
    color: '#777',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const Home = ({ navigation }) => {
  // useRef giúp truy cập vào các FlatList để điều khiển chúng
  const trendingListRef = useRef(null);
  const recommendedListRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [bannerEvents, setBannerEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvents = async (pageNumber = 1) => {
    if (loading || (pageNumber !== 1 && !hasMore)) return;
    pageNumber === 1 ? setLoading(true) : setLoadingMore(true);
    setError(null);

    try {
      const res = await authApi.get('/api/events/', {
        params: { page: pageNumber },
      });

      const newEvents = res.data.results || [];
      if (pageNumber === 1) {
        setEvents(newEvents);
        setBannerEvents(newEvents.slice(0, 1));
        setTrendingEvents(newEvents.slice(1, 5));
        setRecommendedEvents(newEvents.slice(5, 9));
      } else {
        setEvents(prev => [...prev, ...newEvents]);
      }

      if (res.data.next) {
        setHasMore(true);
        setPage(pageNumber + 1);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.log('Fetch events error:', err.response?.data || err.message);
      setError('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEvents(1);
    }, [])
  );

  const fixImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) {
      return url;
    }
    // Nối đường dẫn Cloudinary với đường dẫn tương đối từ API
    return `${CLOUD_BASE_URL}${url}`;
  };

  const renderEventCard = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('EventDetail', { id: item.id })}
      style={styles.eventCard}
    >
      <Image source={{ uri: fixImageUrl(item.media) }} style={styles.eventImage} />
      <View style={styles.eventInfo}>
        <Text style={styles.eventName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.eventDate}>{moment(item.date).format('DD/MM/YYYY')}</Text>
        {item.location && (
          <Text style={styles.eventLocation} numberOfLines={1}>{item.location}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEventItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('EventDetail', { id: item.id })}
      style={styles.eventItem}
    >
      <Image source={{ uri: fixImageUrl(item.media) }} style={styles.eventItemImage} />
      <View style={styles.eventItemText}>
        <Text style={styles.eventItemName}>{item.name}</Text>
        <Text style={styles.eventItemDate}>{moment(item.date).format('DD/MM/YYYY')}</Text>
        <Text style={styles.eventItemLocation}>{item.location}</Text>
      </View>
    </TouchableOpacity>
  );

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchEvents(page);
    }
  };

  // Hàm cuộn ngang FlatList về cuối
  const scrollHorizontally = (listRef) => {
    if (listRef.current) {
      listRef.current.scrollToEnd({ animated: true });
    }
  };

  if (loading && page === 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00aaff" />
      </View>
    );
  }

  // Component Header chứa banner và các danh sách cuộn ngang
  const HeaderComponent = () => (
    <>
      <View style={styles.headerContainer}>
        <Image source={require("../../assets/images/Logo.png")} style={styles.logo} />
        <TouchableOpacity onPress={() => console.log('Search clicked')}>
          <Ionicons name="search" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      {bannerEvents.length > 0 && (
        <View style={styles.bannerBig}>
          <Image source={{ uri: fixImageUrl(bannerEvents[0].media) }} style={styles.bannerBigImage} />
          <TouchableOpacity 
            style={styles.bannerBigButton}
            onPress={() => navigation.navigate('EventDetail', { id: bannerEvents[0].id })}
          >
            <Text style={styles.bannerBigButtonText}>Xem chi tiết</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Section Sự kiện xu hướng */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🔥 Sự kiện xu hướng</Text>
        {/* Nút mũi tên để cuộn list ngang */}
        <TouchableOpacity onPress={() => scrollHorizontally(trendingListRef)}>
          <Ionicons name="arrow-forward-circle-outline" size={30} color="#000" />
        </TouchableOpacity>
      </View>
      <FlatList
        ref={trendingListRef} // Gán ref để điều khiển
        data={trendingEvents}
        renderItem={renderEventCard}
        keyExtractor={(item, index) => `trending-${item?.id || index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 10 }}
        snapToInterval={162}
        decelerationRate="fast"
      />

      {/* Section Dành cho bạn */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🎯 Dành cho bạn</Text>
        {/* Nút mũi tên để cuộn list ngang */}
        <TouchableOpacity onPress={() => scrollHorizontally(recommendedListRef)}>
          <Ionicons name="arrow-forward-circle-outline" size={30} color="#000" />
        </TouchableOpacity>
      </View>
      <FlatList
        ref={recommendedListRef} // Gán ref để điều khiển
        data={recommendedEvents}
        renderItem={renderEventCard}
        keyExtractor={(item, index) => `recommended-${item?.id || index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 10 }}
        snapToInterval={162}
        decelerationRate="fast"
      />

      <Text style={[styles.sectionTitle, { marginHorizontal: 10, marginTop: 15 }]}>📅 Tất cả sự kiện</Text>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={events}
        renderItem={renderEventItem}
        removeClippedSubviews={false}
        keyExtractor={(item, index) => `event-${item?.id || index}`}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={<HeaderComponent />}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator size="small" color="#00aaff" /> : null
        }
      />
    </SafeAreaView>
  );
};

export default Home;