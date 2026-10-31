import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const ACCOUNTS_KEY = "eventflowAccounts";
const USER_KEY = "eventflowUser";
const LOGIN_KEY = "eventflowLoggedIn";

const MAX_IMAGES = 8;
const MAX_ORIGINAL_SIZE_MB = 10;

const IMAGE_MAX_WIDTH = 900;
const IMAGE_MAX_HEIGHT = 900;
const TARGET_IMAGE_SIZE_KB = 220;

const CATEGORIES = [
  "Photography",
  "Videography",
  "Photography & Videography",
  "Decoration",
  "DJ & Music",
  "Catering",
  "Makeup & Beauty",
  "Event Planning",
  "Event Coordination",
  "Entertainment",
  "MC & Hosting",
  "Florist",
  "Fashion & Styling",
  "Rental Services",
  "Printing & Branding",
  "Security",
  "Transportation",
  "Other",
];

const LOCATIONS = [
  "Accra",
  "Kumasi",
  "Takoradi",
  "Cape Coast",
  "Tamale",
  "Koforidua",
  "Ho",
  "Sunyani",
  "Tema",
  "Other",
];

function getAccounts() {
  try {
    const saved = localStorage.getItem(ACCOUNTS_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Unable to read EventFlow accounts:", error);
    return [];
  }
}

function getApproximateSizeMB(value) {
  if (!value) {
    return 0;
  }

  return (value.length * 3) / 4 / 1024 / 1024;
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please select an image file."));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const image = new Image();

      image.onload = () => {
        let width = image.width;
        let height = image.height;

        const scale = Math.min(
          1,
          IMAGE_MAX_WIDTH / width,
          IMAGE_MAX_HEIGHT / height
        );

        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Unable to process this image."));
          return;
        }

        context.drawImage(
          image,
          0,
          0,
          width,
          height
        );

        const qualities = [
          0.60,
          0.50,
          0.40,
          0.32,
          0.25,
        ];

        let bestResult = "";

        for (const quality of qualities) {
          const result = canvas.toDataURL(
            "image/jpeg",
            quality
          );

          bestResult = result;

          const sizeInKB =
            (result.length * 3) / 4 / 1024;

          if (sizeInKB <= TARGET_IMAGE_SIZE_KB) {
            break;
          }
        }

        resolve(bestResult);
      };

      image.onerror = () => {
        reject(new Error("Unable to read this image."));
      };

      image.src = event.target.result;
    };

    reader.onerror = () => {
      reject(new Error("Unable to read this file."));
    };

    reader.readAsDataURL(file);
  });
}

function compressImageAgain(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const maxWidth = 550;
      const maxHeight = 550;

      const scale = Math.min(
        1,
        maxWidth / image.width,
        maxHeight / image.height
      );

      const width = Math.max(
        1,
        Math.round(image.width * scale)
      );

      const height = Math.max(
        1,
        Math.round(image.height * scale)
      );

      const canvas = document.createElement("canvas");

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Unable to process image."));
        return;
      }

      context.drawImage(
        image,
        0,
        0,
        width,
        height
      );

      resolve(
        canvas.toDataURL(
          "image/jpeg",
          0.22
        )
      );
    };

    image.onerror = () => {
      reject(new Error("Unable to process image."));
    };

    image.src = src;
  });
}

function createSmallUserSession(user) {
  /*
   * IMPORTANT:
   * Never put portfolio images inside eventflowUser.
   *
   * eventflowUser is only the current login/session object.
   */
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    accountType: "vendor",
    businessName: user.businessName,
    vendorName: user.vendorName,
    category: user.category,
    location: user.location,
    status: user.status,
    approvalStatus: user.approvalStatus,
    approved: user.approved,
  };
}

function saveAccounts(accounts) {
  const serialized = JSON.stringify(accounts);

  const estimatedSizeMB =
    getApproximateSizeMB(serialized);

  console.log(
    `EventFlow account storage size: ${estimatedSizeMB.toFixed(
      2
    )} MB`
  );

  /*
   * Give ourselves a safety margin.
   *
   * localStorage limits differ between browsers.
   * Keeping the total account payload below roughly 4 MB
   * makes the prototype considerably safer.
   */
  if (estimatedSizeMB > 4) {
    throw new Error(
      "EVENTFLOW_STORAGE_TOO_LARGE"
    );
  }

  localStorage.setItem(
    ACCOUNTS_KEY,
    serialized
  );
}

export default function VendorRegistration() {
  const navigate = useNavigate();
  const location = useLocation();

  const fileInputRef = useRef(null);

  const registrationData =
    location.state || {};

  const [formData, setFormData] =
    useState({
      businessName: "",
      category: "Photography",
      location: "Kumasi",
      description: "",
      startingPrice: "",
      pricingType: "Starting from",
    });

  const [images, setImages] =
    useState([]);

  const [error, setError] =
    useState("");

  const [imageError, setImageError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    personalDetails,
    setPersonalDetails,
  ] = useState({
    firstName:
      registrationData.firstName || "",
    lastName:
      registrationData.lastName || "",
    email:
      registrationData.email || "",
    phone:
      registrationData.phone || "",
    password:
      registrationData.password || "",
  });

  useEffect(() => {
    if (!registrationData.email) {
      setError(
        "Please complete the main registration form before continuing."
      );
    }
  }, [registrationData.email]);

  const imageCountText =
    useMemo(() => {
      if (images.length === 0) {
        return "No photos selected";
      }

      if (images.length === 1) {
        return "1 photo selected";
      }

      return `${images.length} photos selected`;
    }, [images.length]);

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleImageSelection = async (
    event
  ) => {
    const selectedFiles =
      Array.from(
        event.target.files || []
      );

    if (!selectedFiles.length) {
      return;
    }

    setImageError("");

    if (
      images.length >= MAX_IMAGES
    ) {
      setImageError(
        `You can upload a maximum of ${MAX_IMAGES} portfolio photos.`
      );

      event.target.value = "";

      return;
    }

    const availableSlots =
      MAX_IMAGES - images.length;

    const filesToProcess =
      selectedFiles.slice(
        0,
        availableSlots
      );

    setLoading(true);

    const processedImages = [];

    try {
      for (const file of filesToProcess) {
        if (
          !file.type.startsWith("image/")
        ) {
          setImageError(
            `"${file.name}" is not an image file and was skipped.`
          );

          continue;
        }

        const sizeInMB =
          file.size /
          (1024 * 1024);

        if (
          sizeInMB >
          MAX_ORIGINAL_SIZE_MB
        ) {
          setImageError(
            `"${file.name}" is larger than ${MAX_ORIGINAL_SIZE_MB}MB and was skipped.`
          );

          continue;
        }

        try {
          const compressed =
            await compressImage(file);

          const compressedSize =
            getApproximateSizeMB(
              compressed
            );

          console.log(
            `${file.name}: ${compressedSize.toFixed(
              2
            )} MB after compression`
          );

          processedImages.push({
            id:
              `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`,
            src: compressed,
            name: file.name,
          });
        } catch (processingError) {
          console.error(
            "Image processing error:",
            processingError
          );

          setImageError(
            `"${file.name}" could not be processed and was skipped.`
          );
        }
      }

      if (
        processedImages.length
      ) {
        setImages(
          (previous) => [
            ...previous,
            ...processedImages,
          ]
        );
      }

      if (
        selectedFiles.length >
        availableSlots
      ) {
        setImageError(
          `Only ${availableSlots} more ${
            availableSlots === 1
              ? "photo"
              : "photos"
          } can be added.`
        );
      }
    } finally {
      setLoading(false);

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }
    }
  };

  const removeImage = (
    imageId
  ) => {
    setImages(
      (previous) =>
        previous.filter(
          (image) =>
            image.id !== imageId
        )
    );

    setImageError("");
  };

  const moveImageToFront = (
    imageId
  ) => {
    setImages(
      (previous) => {
        const selected =
          previous.find(
            (image) =>
              image.id === imageId
          );

        if (!selected) {
          return previous;
        }

        return [
          selected,
          ...previous.filter(
            (image) =>
              image.id !== imageId
          ),
        ];
      }
    );
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    const firstName =
      personalDetails.firstName.trim();

    const lastName =
      personalDetails.lastName.trim();

    const email =
      personalDetails.email
        .trim()
        .toLowerCase();

    const phone =
      personalDetails.phone.trim();

    const password =
      personalDetails.password;

    const businessName =
      formData.businessName.trim();

    const category =
      formData.category.trim();

    const locationValue =
      formData.location.trim();

    const description =
      formData.description.trim();

    const startingPrice =
      formData.startingPrice.trim();

    if (!firstName) {
      setError(
        "Please enter your first name."
      );
      return;
    }

    if (!lastName) {
      setError(
        "Please enter your last name."
      );
      return;
    }

    if (!email) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    if (!phone) {
      setError(
        "Please enter your phone number."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "Your password must be at least 6 characters."
      );
      return;
    }

    if (!businessName) {
      setError(
        "Please enter your business or professional name."
      );
      return;
    }

    if (!category) {
      setError(
        "Please select your main service category."
      );
      return;
    }

    if (!locationValue) {
      setError(
        "Please select your operating location."
      );
      return;
    }

    if (!description) {
      setError(
        "Please provide a short description of your services."
      );
      return;
    }

    if (description.length < 20) {
      setError(
        "Your business description should contain at least 20 characters."
      );
      return;
    }

    if (!startingPrice) {
      setError(
        "Please enter your starting price."
      );
      return;
    }

    const numericPrice =
      Number(
        startingPrice.replace(
          /[^0-9.]/g,
          ""
        )
      );

    if (
      !Number.isFinite(
        numericPrice
      ) ||
      numericPrice <= 0
    ) {
      setError(
        "Please enter a valid starting price."
      );
      return;
    }

    setLoading(true);

    try {
      let accounts =
        getAccounts();

      const emailAlreadyExists =
        accounts.some(
          (account) =>
            String(
              account.email || ""
            )
              .trim()
              .toLowerCase() ===
            email
        );

      if (
        emailAlreadyExists
      ) {
        setError(
          "An EventFlow account with this email already exists. Please log in instead."
        );

        setLoading(false);
        return;
      }

      const now =
        new Date().toISOString();

      let imageSources =
        images.map(
          (image) =>
            image.src
        );

      /*
       * Keep the portfolio inside the ACCOUNT record only.
       *
       * We intentionally do NOT create:
       * photos
       * image
       * imageUrl
       * photo
       *
       * because those would duplicate the same Base64 data.
       */
      let user = {
        id:
          `vendor-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        firstName,
        lastName,
        email,
        phone,
        password,

        accountType:
          "vendor",

        businessName,

        vendorName:
          businessName,

        category,

        serviceCategory:
          category,

        location:
          locationValue,

        description,

        price:
          numericPrice,

        startingPrice:
          numericPrice,

        pricingType:
          "Starting from",

        images:
          imageSources,

        coverImage:
          imageSources[0] || "",

        imageCount:
          imageSources.length,

        status:
          "pending",

        approvalStatus:
          "pending",

        approved:
          false,

        createdAt:
          now,

        updatedAt:
          now,
      };

      /*
       * ----------------------------------------------------------
       * First save attempt
       * ----------------------------------------------------------
       */

      try {
        saveAccounts([
          ...accounts,
          user,
        ]);
      } catch (storageError) {
        console.warn(
          "First account save failed. Compressing images further.",
          storageError
        );

        /*
         * --------------------------------------------------------
         * Second attempt
         * --------------------------------------------------------
         */

        const smallerImages = [];

        for (
          const image of imageSources
        ) {
          try {
            const smaller =
              await compressImageAgain(
                image
              );

            smallerImages.push(
              smaller
            );
          } catch (
            compressionError
          ) {
            console.error(
              "Fallback compression failed:",
              compressionError
            );
          }
        }

        imageSources =
          smallerImages;

        user = {
          ...user,

          images:
            imageSources,

          coverImage:
            imageSources[0] || "",

          imageCount:
            imageSources.length,
        };

        try {
          saveAccounts([
            ...accounts,
            user,
          ]);
        } catch (
          secondStorageError
        ) {
          console.warn(
            "Second account save failed. Keeping fewer photos.",
            secondStorageError
          );

          /*
           * ------------------------------------------------------
           * Third attempt:
           * Keep only the first 3 portfolio images.
           * ------------------------------------------------------
           */

          const limitedImages =
            imageSources.slice(
              0,
              3
            );

          user = {
            ...user,

            images:
              limitedImages,

            coverImage:
              limitedImages[0] ||
              "",

            imageCount:
              limitedImages.length,
          };

          try {
            saveAccounts([
              ...accounts,
              user,
            ]);
          } catch (
            finalStorageError
          ) {
            console.error(
              "Unable to save vendor account:",
              finalStorageError
            );

            setError(
              "EventFlow storage is full. Please clear old EventFlow test data from your browser and try again."
            );

            setLoading(false);
            return;
          }
        }
      }

      /*
       * ==========================================================
       * IMPORTANT FIX
       * ==========================================================
       *
       * Do NOT save the complete vendor object to eventflowUser.
       *
       * The complete vendor object contains Base64 images.
       *
       * Instead, save only a small session object.
       */

      const sessionUser =
        createSmallUserSession(
          user
        );

      localStorage.setItem(
        USER_KEY,
        JSON.stringify(
          sessionUser
        )
      );

      localStorage.setItem(
        LOGIN_KEY,
        "true"
      );

      window.dispatchEvent(
        new Event(
          "eventflow-auth-changed"
        )
      );

      window.dispatchEvent(
        new Event(
          "eventflow-vendors-updated"
        )
      );

      navigate(
        "/dashboard/vendor",
        {
          replace: true,
        }
      );
    } catch (
      registrationError
    ) {
      console.error(
        "Vendor registration error:",
        registrationError
      );

      setError(
        "Something went wrong while creating your vendor account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <Navbar />

      <main className="relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 top-20 h-80 w-80 rounded-full bg-indigo-100/50 blur-3xl" />

          <div className="absolute -right-40 top-40 h-96 w-96 rounded-full bg-purple-100/50 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="mb-8">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
            >
              <span>←</span>
              Back to registration
            </Link>

            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                Vendor registration
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Build your EventFlow vendor profile
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Tell organizers about your business,
                showcase your previous work, and submit
                your profile for EventFlow approval.
              </p>
            </div>
          </div>

          <div className="mb-7 flex gap-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
              ✓
            </div>

            <div>
              <p className="text-sm font-bold text-indigo-950">
                Your profile will be reviewed before going live
              </p>

              <p className="mt-1 text-sm leading-6 text-indigo-800/80">
                EventFlow reviews vendor applications
                and portfolio images before a vendor
                profile is made available to organizers.
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-7 flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold">
                !
              </span>

              <p className="leading-5">
                {error}
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-7"
          >
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                  Step 01
                </p>

                <h2 className="mt-2 text-xl font-bold text-slate-950">
                  Your account details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  These details are connected to your
                  vendor account.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <ReadOnlyField
                  label="First name"
                  value={
                    personalDetails.firstName
                  }
                />

                <ReadOnlyField
                  label="Last name"
                  value={
                    personalDetails.lastName
                  }
                />

                <ReadOnlyField
                  label="Email address"
                  value={
                    personalDetails.email
                  }
                />

                <ReadOnlyField
                  label="Phone number"
                  value={
                    personalDetails.phone
                  }
                />
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                  Step 02
                </p>

                <h2 className="mt-2 text-xl font-bold text-slate-950">
                  Business information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Give organizers enough information to
                  understand what you offer.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="businessName"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Business or professional name
                  </label>

                  <input
                    id="businessName"
                    name="businessName"
                    value={
                      formData.businessName
                    }
                    onChange={handleChange}
                    placeholder="e.g. Christopher Photography"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Main service category
                  </label>

                  <select
                    id="category"
                    name="category"
                    value={
                      formData.category
                    }
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  >
                    {CATEGORIES.map(
                      (category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="location"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Primary operating location
                  </label>

                  <select
                    id="location"
                    name="location"
                    value={
                      formData.location
                    }
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  >
                    {LOCATIONS.map(
                      (
                        locationOption
                      ) => (
                        <option
                          key={
                            locationOption
                          }
                          value={
                            locationOption
                          }
                        >
                          {
                            locationOption
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="description"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    About your business
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    value={
                      formData.description
                    }
                    onChange={handleChange}
                    rows={5}
                    placeholder="Tell organizers about your experience, the services you provide, and what makes your work suitable for events."
                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-6 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  />

                  <div className="mt-2 flex justify-between gap-3">
                    <p className="text-xs text-slate-400">
                      Minimum 20 characters.
                    </p>

                    <p className="text-xs text-slate-400">
                      {
                        formData
                          .description
                          .length
                      }{" "}
                      characters
                    </p>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="startingPrice"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Starting price
                  </label>

                  <div className="mt-2 flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50">
                    <span className="flex items-center border-r border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-500">
                      GH₵
                    </span>

                    <input
                      id="startingPrice"
                      name="startingPrice"
                      type="number"
                      min="1"
                      step="0.01"
                      value={
                        formData.startingPrice
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="1500"
                      className="min-w-0 flex-1 px-4 py-3.5 text-sm outline-none"
                    />
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    This is a starting price. The final
                    price is agreed with the organizer
                    through the quotation process.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                    Step 03
                  </p>

                  <h2 className="mt-2 text-xl font-bold text-slate-950">
                    Portfolio & previous work
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                    Upload photos that show the quality
                    of your previous work.
                  </p>
                </div>

                <div className="shrink-0 rounded-xl bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500">
                  {imageCountText}
                </div>
              </div>

              <div
                onClick={() =>
                  !loading &&
                  images.length <
                    MAX_IMAGES &&
                  fileInputRef.current?.click()
                }
                className={`group cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition sm:p-8 ${
                  images.length >=
                    MAX_IMAGES ||
                  loading
                    ? "cursor-not-allowed border-slate-200 bg-slate-50"
                    : "border-slate-200 bg-slate-50/70 hover:border-indigo-400 hover:bg-indigo-50/40"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={
                    handleImageSelection
                  }
                  className="hidden"
                  disabled={
                    loading ||
                    images.length >=
                      MAX_IMAGES
                  }
                />

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-2xl">
                  📸
                </div>

                <p className="mt-4 text-sm font-bold text-slate-900">
                  {loading
                    ? "Optimising photos..."
                    : images.length >=
                      MAX_IMAGES
                    ? "Maximum photos added"
                    : "Upload photos of your work"}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  JPG, PNG, WEBP or GIF · Up to{" "}
                  {MAX_IMAGES} photos
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Images are automatically compressed
                  for faster loading.
                </p>

                {images.length <
                  MAX_IMAGES &&
                  !loading && (
                    <span className="mt-4 inline-flex rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition group-hover:bg-indigo-700">
                      Choose photos
                    </span>
                  )}
              </div>

              {imageError && (
                <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                  {imageError}
                </div>
              )}

              {images.length > 0 && (
                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">
                      Uploaded work
                    </p>

                    <p className="text-xs text-slate-400">
                      First photo = cover
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {images.map(
                      (
                        image,
                        index
                      ) => (
                        <div
                          key={
                            image.id
                          }
                          className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                        >
                          <img
                            src={
                              image.src
                            }
                            alt={`Portfolio work ${
                              index +
                              1
                            }`}
                            className="aspect-square w-full object-cover"
                          />

                          {index ===
                            0 && (
                            <div className="absolute left-2 top-2 rounded-lg bg-slate-950/80 px-2.5 py-1 text-[10px] font-bold text-white">
                              Cover photo
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              removeImage(
                                image.id
                              )
                            }
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-sm font-bold text-slate-700 shadow-md hover:bg-red-50 hover:text-red-600"
                            aria-label="Remove photo"
                          >
                            ×
                          </button>

                          {index !==
                            0 && (
                            <button
                              type="button"
                              onClick={() =>
                                moveImageToFront(
                                  image.id
                                )
                              }
                              className="absolute bottom-2 left-2 rounded-lg bg-white/95 px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 opacity-0 shadow-md transition group-hover:opacity-100 hover:text-indigo-600"
                            >
                              Make cover
                            </button>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex gap-3">
                  <span>ℹ️</span>

                  <p className="text-xs leading-5 text-slate-500">
                    Upload genuine examples of your previous
                    work. EventFlow may review submitted images
                    before approving your vendor profile.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Ready to submit your vendor profile?
                  </p>

                  <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                    Your account will be submitted for EventFlow
                    review. Your profile and portfolio will become
                    publicly available after approval.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Submitting..."
                    : "Submit vendor profile"}

                  {!loading && (
                    <span className="transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  )}
                </button>
              </div>
            </section>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-600">
        {value || "Not provided"}
      </div>
    </div>
  );
}