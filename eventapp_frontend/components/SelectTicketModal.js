import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authApi } from "../services/api";

export default function SelectTicketModal({
  visible,
  onClose,
  eventId,
  onBookingCreated,
}) {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState("");

  const insets = useSafeAreaInsets();

  const getRemaining = (t) =>
    t.remaining ?? t.available ?? t.quantity ?? t.remain ?? 0;

  useEffect(() => {
    if (!visible) return;
    setLoading(true);

    authApi
      .get(`/api/events/${eventId}/`)
      .then((res) => {
        // Lấy trực tiếp danh sách tickets từ event
        setTickets(res.data?.tickets || []);
        // ✅ Lưu luôn tên sự kiện để truyền sang màn review
        setEventName(res.data?.name || "");
      })
      .catch((err) => {
        console.error("❌ Loi khi fetch tickets:", err.response?.data || err);
      })
      .finally(() => setLoading(false));
  }, [visible, eventId]);

  useEffect(() => {
    if (!visible) {
      setSelected({});
    }
  }, [visible]);

  const totalPrice = useMemo(() => {
    return tickets.reduce((sum, t) => {
      const qty = Number(selected[t.id] || 0);
      const price = Number(t.price || 0);
      return sum + qty * price;
    }, 0);
  }, [tickets, selected]);

  const inc = (ticket) => {
    const remain = getRemaining(ticket);
    const current = Number(selected[ticket.id] || 0);
    if (current >= remain) return;
    const next = current + 1;
    setSelected((prev) => {
      const updated = { ...prev, [ticket.id]: next };
      console.log("Selected after increment:", updated);
      return updated;
    });
  };

  const dec = (ticket) => {
    const current = Number(selected[ticket.id] || 0);
    if (current <= 0) return;
    const next = current - 1;
    setSelected((prev) => {
      const updated = { ...prev };
      if (next === 0) delete updated[ticket.id];
      else updated[ticket.id] = next;
      console.log("Selected after decrement:", updated);
      return updated;
    });
  };

  const handleCreateBooking = async () => {
    console.log("🚀 Bat dau handleCreateBooking");

    try {
      // Chỉ gửi tickets cho backend
      const payload = {
        tickets: Object.entries(selected).map(([ticketId, qty]) => ({
          ticket_id: Number(ticketId),
          quantity: qty,
        })),
      };

      console.log("📦 Booking payload:", payload);

      const token = await AsyncStorage.getItem("access-token");
      if (!token) {
        console.warn("❌ Khong tim thay token, user chua dang nhap?");
        return;
      }

      // Gui request tao booking
      const res = await authApi.post("/api/bookings/", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Booking response:", res.data);

      // Lay bookingId va dieu huong sang trang checkout
      const bookingId = res?.data?.id;
      if (bookingId) {
        onClose(); // đóng modal
        onBookingCreated(bookingId, eventName); // báo cho component cha biết booking đã tạo
      }
    } catch (err) {
      console.error("🔥 Booking error:", err.response?.data || err);
    }

    console.log("🏁 Ket thuc handleCreateBooking");
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      backdropOpacity={0.6}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      useNativeDriver={false}
      swipeDirection="down"
      onSwipeComplete={onClose}
      style={{
        justifyContent: "flex-end",
        margin: 0,
        paddingBottom: insets.bottom, // tự động tránh thanh điều hướng
      }}
      statusBarTranslucent
    >
      {/* Blur background */}
      <BlurView
        intensity={50}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Modal content */}
      <View style={styles.container}>
        <View style={styles.dragHandleContainer}>
          <View style={styles.dragHandle} />
        </View>
        <Text style={styles.title}>Chọn vé</Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        ) : (
          <ScrollView style={{ maxHeight: 400 }}>
            {tickets.length === 0 ? (
              <Text>Hiện không có vé khả dụng.</Text>
            ) : (
              tickets.map((t) => {
                const remain = getRemaining(t);
                const qty = Number(selected[t.id] || 0);
                const soldOut = remain <= 0;

                return (
                  <View key={t.id} style={styles.ticketRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ticketName}>
                        {t.ticket_class || "Vé"}
                      </Text>
                      <Text style={styles.ticketPrice}>
                        {Number(t.price || 0).toLocaleString("vi-VN")}đ
                      </Text>
                      <Text style={styles.ticketRemain}>Còn lại: {remain}</Text>
                    </View>

                    <View style={styles.qtyGroup}>
                      <TouchableOpacity
                        onPress={() => dec(t)}
                        disabled={qty === 0}
                        style={[
                          styles.qtyBtn,
                          qty === 0 && styles.qtyBtnDisabled,
                        ]}
                      >
                        <Ionicons name="remove" size={18} color="#000" />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{qty}</Text>
                      <TouchableOpacity
                        onPress={() => inc(t)}
                        disabled={soldOut || qty >= remain}
                        style={[
                          styles.qtyBtn,
                          (soldOut || qty >= remain) && styles.qtyBtnDisabled,
                        ]}
                      >
                        <Ionicons name="add" size={18} color="#000" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Tổng tiền + nút tiếp tục */}
        <View style={styles.footer}>
          <Text style={styles.totalLabel}>Tổng tiền</Text>
          <Text style={styles.totalValue}>
            {totalPrice.toLocaleString("vi-VN")}đ
          </Text>
          <TouchableOpacity
            onPress={handleCreateBooking}
            disabled={totalPrice <= 0}
            style={[
              styles.primaryBtn,
              totalPrice <= 0 && styles.primaryBtnDisabled,
            ]}
          >
            <Text style={styles.primaryBtnText}>Tiếp tục</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    height: 100,
  },
  ticketRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    gap: 12,
  },
  ticketName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    marginBottom: 4,
  },
  ticketPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#e53935",
  },
  ticketRemain: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  qtyGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  qtyBtnDisabled: {
    opacity: 0.4,
  },
  qtyText: {
    minWidth: 28,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  totalLabel: {
    fontSize: 13,
    color: "#666",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#222",
  },
  primaryBtn: {
    backgroundColor: "#2ecc71",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingVertical: 5,
  },
  dragHandle: {
    width: 60,
    height: 3,
    borderRadius: 3,
    backgroundColor: "#ccc",
  },
});
