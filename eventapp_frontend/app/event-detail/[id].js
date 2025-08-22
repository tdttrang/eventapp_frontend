import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import api from '../../services/api';

export default function EventDetail() {
  const { id } = useLocalSearchParams(); // Lấy id từ URL
  const [event, setEvent] = useState(null); // Dữ liệu sự kiện
  const [loading, setLoading] = useState(true);

  // Gọi API lấy chi tiết sự kiện
  useEffect(() => {
    api.get(`events/${id}/`)
      .then(res => setEvent(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  // Loading state
  if (loading) return <ActivityIndicator style={styles.center} />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{event.name}</Text>
      <Text style={styles.date}>{event.date}</Text>
      <Text>{event.description}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  date: { marginVertical: 8, fontStyle: 'italic' }
});