import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useAlert } from "@/context/AlertContext";
import { BadgeType } from "@/components/verification-badges";
import api from "@/config/api";

const PRIMARY_COLOR = "#3B82F6";

export function useSellerVerification(paramsStoreName?: string, paramsTypeSlug?: string) {
  const router = useRouter();
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const { showWarning, showError } = useAlert();

  const storeName = paramsStoreName || user?.name || "Your Store";

  const [activeLevel, setActiveLevel] = useState("identity");
  const [showInfo, setShowInfo] = useState(false);
  const [idType, setIdType] = useState("bvn");
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [dob, setDob] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessNo, setBusinessNo] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopNo, setShopNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [myBadges, setMyBadges] = useState<BadgeType[]>(["phone_verified"]);
  const [businessMode, setBusinessMode] = useState<string | null>(null);
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);

  const [idDocumentUri, setIdDocumentUri] = useState<string | null>(null);
  const [selfieDocumentUri, setSelfieDocumentUri] = useState<string | null>(null);
  const [generalDocumentUri, setGeneralDocumentUri] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<string>("none");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const res = await fetch(api.ENDPOINTS.VENDOR.VERIFICATIONS, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.badges) setMyBadges(json.badges);
        if (json.requests && Array.isArray(json.requests) && json.requests.length > 0) {
          setVerificationRequests(json.requests);
          const latestReq = json.requests[0];
          setVerificationStatus(latestReq.status || "pending");

          if (latestReq.status === "pending" || latestReq.status === "under_review" || latestReq.status === "approved") {
            setIsEditing(false);
          }

          json.requests.forEach((req: any) => {
            let meta = req.metadata;
            if (typeof meta === "string") {
              try {
                meta = JSON.parse(meta);
              } catch (e) {}
            }
            if (meta && typeof meta === "object") {
              if (meta.full_name) setFullName(meta.full_name);
              if (meta.id_number) setIdNumber(meta.id_number);
              if (meta.id_type) setIdType(meta.id_type);
              if (meta.dob) setDob(meta.dob);
              if (meta.business_name) setBusinessName(meta.business_name);
              if (meta.business_no) setBusinessNo(meta.business_no);
              if (meta.shop_address) setShopAddress(meta.shop_address);
              if (meta.shop_no) setShopNo(meta.shop_no);
            }

            if (req.documents && Array.isArray(req.documents)) {
              req.documents.forEach((doc: any) => {
                const url = doc.document_url || doc.file_path;
                if (doc.document_type === "id_card_doc") setIdDocumentUri(url);
                if (doc.document_type === "selfie_doc") setSelfieDocumentUri(url);
                if (doc.document_type?.includes("store") || doc.document_type?.includes("physical") || doc.document_type?.includes("doc")) {
                  setGeneralDocumentUri(url);
                }
              });
            }
          });
        }
        if (json.seller?.business_mode) setBusinessMode(json.seller.business_mode);
      }
    } catch (e) {
      console.log("Error fetching verifications:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const isOnlineOnly =
    (paramsTypeSlug && (paramsTypeSlug.includes("online") || paramsTypeSlug.includes("whatsapp") || paramsTypeSlug.includes("digital") || paramsTypeSlug.includes("reseller"))) ||
    businessMode === "online";

  const allActionLevels = [
    {
      id: "identity",
      levelNum: 1,
      title: "Identity",
      subtitle: "Level 1 • Person",
      badge: "identity_verified",
      icon: "id-card-outline",
      color: PRIMARY_COLOR,
      tag: "Mandatory",
      desc: "Mandatory for all sellers: Verifies your person identity via NIN/BVN digital lookup and facial selfie photo.",
    },
    {
      id: "business",
      levelNum: 2,
      title: "Business",
      subtitle: "Level 2 • CAC",
      badge: "business_verified",
      icon: "business-outline",
      color: PRIMARY_COLOR,
      tag: "Optional (CAC)",
      desc: "Optional for individual online sellers. Required only if your business is officially registered with CAC (Corporate Affairs Commission).",
    },
    {
      id: "physical_store",
      levelNum: 3,
      title: "Store",
      subtitle: "Level 3 • Location",
      badge: "store_verified",
      icon: "location-outline",
      color: PRIMARY_COLOR,
      tag: "Physical Shop",
      desc: "Verifies physical market location (Shop address, suite number & storefront photo).",
    },
  ];

  const actionLevels = isOnlineOnly
    ? allActionLevels.filter((lvl) => lvl.id !== "physical_store")
    : allActionLevels;

  const pickImage = async (type: "id" | "selfie" | "general") => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showWarning("Permission Required", "Please grant photo library access to upload documents.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (type === "id") setIdDocumentUri(uri);
        else if (type === "selfie") setSelfieDocumentUri(uri);
        else setGeneralDocumentUri(uri);
      }
    } catch (error: any) {
      showError(
        "Rebuild Required",
        "The app binary needs to compile native modules for image picking. Please restart your Android build using: npx expo run:android"
      );
    }
  };

  const takeCameraPhoto = async (type: "id" | "selfie" | "general") => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showWarning("Permission Required", "Please grant camera permissions to capture a live photo.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        cameraType: type === "selfie" ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (type === "id") setIdDocumentUri(uri);
        else if (type === "selfie") setSelfieDocumentUri(uri);
        else setGeneralDocumentUri(uri);
      }
    } catch (error: any) {
      showError("Camera Error", error.message || "Failed to open camera device.");
    }
  };

  const currentLevelObj = actionLevels.find((l) => l.id === activeLevel) || actionLevels[0];

  const handleSubmitVerification = async () => {
    if (activeLevel === "identity") {
      if (!fullName.trim()) {
        showWarning("Required Field", "Please enter your full legal name as shown on your document.");
        return;
      }
      if (!idNumber.trim()) {
        showWarning(
          "Required Field",
          idType === "bvn"
            ? "Please enter your 11-digit BVN number."
            : idType === "nin"
            ? "Please enter your 11-digit NIN number."
            : "Please enter your Government ID number."
        );
        return;
      }
      if ((idType === "bvn" || idType === "nin") && idNumber.trim().length !== 11) {
        showWarning(
          "Invalid ID Number",
          idType === "bvn"
            ? "Bank Verification Number (BVN) must be exactly 11 digits."
            : "National Identity Number (NIN) must be exactly 11 digits."
        );
        return;
      }
      if (!dob.trim()) {
        showWarning("Required Field", "Please select your Date of Birth.");
        return;
      }
      if (!selfieDocumentUri) {
        showWarning("Missing Live Selfie", "Please take and upload a live selfie facial photo for identity verification.");
        return;
      }
      if (idType !== "bvn" && idType !== "nin" && !idDocumentUri) {
        showWarning("Missing ID Document", "Please upload a photo of your official Government ID card.");
        return;
      }
    }

    if (activeLevel === "business") {
      // CAC verification is optional for individual sellers.
      if (!businessName.trim() && !businessNo.trim()) {
        const currentIndex = actionLevels.findIndex((lvl) => lvl.id === activeLevel);
        if (currentIndex !== -1 && currentIndex + 1 < actionLevels.length) {
          const nextLevel = actionLevels[currentIndex + 1].id;
          setActiveLevel(nextLevel);
          return;
        }
      }
    }

    if (activeLevel === "physical_store") {
      if (!shopAddress.trim() || !shopNo.trim()) {
        showWarning("Required Field", "Please enter your physical shop address and shop number.");
        return;
      }
      if (!generalDocumentUri) {
        showWarning("Missing Storefront Photo", "Please upload a photo of your physical shop front.");
        return;
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("verification_type", String(activeLevel));

      if (idType) formData.append("id_type", String(idType));
      if (fullName.trim()) formData.append("full_name", String(fullName.trim()));
      if (idNumber.trim()) formData.append("id_number", String(idNumber.trim()));
      if (dob.trim()) formData.append("dob", String(dob.trim()));
      if (businessName.trim()) formData.append("business_name", String(businessName.trim()));
      if (businessNo.trim()) formData.append("business_no", String(businessNo.trim()));
      if (shopAddress.trim()) formData.append("shop_address", String(shopAddress.trim()));
      if (shopNo.trim()) formData.append("shop_no", String(shopNo.trim()));

      if (selfieDocumentUri && (selfieDocumentUri.startsWith("file://") || selfieDocumentUri.startsWith("content://"))) {
        const filename = selfieDocumentUri.split("/").pop() || "selfie.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const fileType = match ? `image/${match[1].toLowerCase()}` : "image/jpeg";
        formData.append("selfie_document", {
          uri: selfieDocumentUri,
          name: filename,
          type: fileType,
        } as any);
      }

      if (idDocumentUri && (idDocumentUri.startsWith("file://") || idDocumentUri.startsWith("content://"))) {
        const filename = idDocumentUri.split("/").pop() || "id_card.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const fileType = match ? `image/${match[1].toLowerCase()}` : "image/jpeg";
        formData.append("id_document", {
          uri: idDocumentUri,
          name: filename,
          type: fileType,
        } as any);
      }

      if (generalDocumentUri && (generalDocumentUri.startsWith("file://") || generalDocumentUri.startsWith("content://"))) {
        const filename = generalDocumentUri.split("/").pop() || "storefront.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const fileType = match ? `image/${match[1].toLowerCase()}` : "image/jpeg";
        formData.append("document", {
          uri: generalDocumentUri,
          name: filename,
          type: fileType,
        } as any);
      }

      const { status, json } = await new Promise<{ status: number; json: any }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", api.ENDPOINTS.VENDOR.VERIFICATIONS);
        xhr.setRequestHeader("Accept", "application/json");
        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        xhr.onload = () => {
          try {
            const parsed = JSON.parse(xhr.responseText);
            resolve({ status: xhr.status, json: parsed });
          } catch (e) {
            resolve({ status: xhr.status, json: { message: xhr.responseText || "Server response format error" } });
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network connection error submitting verification."));
        };

        xhr.send(formData as any);
      });

      if (status >= 200 && status < 300) {
        showToast("Verification details submitted successfully!", "success");

        if (activeLevel === "identity" && !myBadges.includes("identity_verified")) {
          setMyBadges([...myBadges, "identity_verified"]);
        } else if (activeLevel === "business" && !myBadges.includes("business_verified")) {
          setMyBadges([...myBadges, "business_verified"]);
        } else if (activeLevel === "physical_store" && !myBadges.includes("store_verified")) {
          setMyBadges([...myBadges, "store_verified"]);
        }

        const currentIndex = actionLevels.findIndex((lvl) => lvl.id === activeLevel);
        const isLastTab = currentIndex === actionLevels.length - 1;

        if (isLastTab) {
          showToast("Verification submitted successfully! Pending admin review.", "success");
          fetchVerificationStatus();
          setTimeout(() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(seller)" as any);
            }
          }, 1200);
        } else if (currentIndex !== -1 && currentIndex + 1 < actionLevels.length) {
          const nextLevel = actionLevels[currentIndex + 1].id;
          setActiveLevel(nextLevel);
          fetchVerificationStatus();
        }
      } else {
        const errorMsg =
          json.message ||
          (json.errors ? Object.values(json.errors).flat().join("\n") : "Failed to submit verification request.");
        showToast(errorMsg, "error");
        showError("Submission Error", errorMsg);
      }
    } catch (error: any) {
      console.error("Verification submit error:", error);
      showToast(error.message || "Network error submitting verification.", "error");
      showError("Network Error", error.message || "Could not connect to verification server.");
    } finally {
      setLoading(false);
    }
  };

  return {
    storeName,
    activeLevel,
    setActiveLevel,
    showInfo,
    setShowInfo,
    idType,
    setIdType,
    fullName,
    setFullName,
    idNumber,
    setIdNumber,
    dob,
    setDob,
    showDatePicker,
    setShowDatePicker,
    businessName,
    setBusinessName,
    businessNo,
    setBusinessNo,
    shopAddress,
    setShopAddress,
    shopNo,
    setShopNo,
    loading,
    myBadges,
    businessMode,
    verificationRequests,
    idDocumentUri,
    selfieDocumentUri,
    generalDocumentUri,
    pickImage,
    takeCameraPhoto,
    isEditing,
    setIsEditing,
    verificationStatus,
    refreshing,
    refreshStatus: fetchVerificationStatus,
    actionLevels,
    currentLevelObj,
    handleSubmitVerification,
    PRIMARY_COLOR,
  };
}
