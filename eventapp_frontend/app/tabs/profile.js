import { Box, Heading } from 'native-base';

export default function ProfileScreen() {
  return (
    <Box flex={1} p={4} bg="white">
      <Heading mb={4} size="lg">Hồ sơ</Heading>
      {/* Thêm login/logout, thông tin user sau */}
    </Box>
  );
}