import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { supabase } from "./supabase";

// Cấu hình Google Sign-In (gọi 1 lần duy nhất khi app khởi động)
export function configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    offlineAccess: true,
  });
}

export type GoogleSignInResult =
  | { success: true; user: any }
  | { success: false; cancelled: boolean; error?: string };

// Hàm đăng nhập với Google
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const response = await GoogleSignin.signIn();

    if (isSuccessResponse(response)) {
      const idToken = response.data.idToken;

      if (!idToken) {
        return {
          success: false,
          cancelled: false,
          error: "Không lấy được ID Token",
        };
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });

      if (error) {
        return { success: false, cancelled: false, error: error.message };
      }

      return { success: true, user: data.user };
    }

    return { success: false, cancelled: true };
  } catch (error) {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          return { success: false, cancelled: true };
        case statusCodes.IN_PROGRESS:
          return { success: false, cancelled: false, error: "Đang xử lý..." };
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          return {
            success: false,
            cancelled: false,
            error: "Play Services không khả dụng",
          };
        default:
          return { success: false, cancelled: false, error: error.message };
      }
    }
    return { success: false, cancelled: false, error: "Lỗi không xác định" };
  }
}

// Hàm đăng xuất
export async function signOutFromGoogle(): Promise<void> {
  await Promise.allSettled([GoogleSignin.signOut(), supabase.auth.signOut()]);
}
