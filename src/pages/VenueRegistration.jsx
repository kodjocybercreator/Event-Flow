import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const MAX_GALLERY_IMAGES = 8;

// Original file limit before compression.
const MAX_IMAGE_SIZE_MB = 10;

// Maximum dimensions of the compressed image.
const MAX_IMAGE_WIDTH = 1600;
const MAX_IMAGE_HEIGHT = 1200;

// JPEG quality after compression.
const IMAGE_QUALITY = 0.72;

export default function VenueRegistration() {
  const fileInputRef = useRef(null);

  let currentUser = null;

  try {
    currentUser = JSON.parse(
      localStorage.getItem("eventflowUser") || "null"
    );
  } catch {
    currentUser = null;
  }

  const [formData, setFormData] = useState({
    businessName: "",
    ownerName:
      currentUser?.firstName && currentUser?.lastName
        ? `${currentUser.firstName} ${currentUser.lastName}`
        : currentUser?.firstName || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    venueType: "",
    location: "",
    capacity: "",
    price: "",
    description: "",
  });

  const [galleryImages, setGalleryImages] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  /*
    Compresses the selected image before storing it.

    This is important because localStorage has a relatively small
    storage limit. Saving the original phone image directly as
    base64 can easily exceed that limit.
  */
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const image = new Image();

        image.onload = () => {
          let width = image.width;
          let height = image.height;

          const widthRatio = MAX_IMAGE_WIDTH / width;
          const heightRatio = MAX_IMAGE_HEIGHT / height;

          const ratio = Math.min(
            widthRatio,
            heightRatio,
            1
          );

          width = Math.round(width * ratio);
          height = Math.round(height * ratio);

          const canvas = document.createElement("canvas");

          canvas.width = width;
          canvas.height = height;

          const context = canvas.getContext("2d");

          if (!context) {
            reject(
              new Error("Your browser could not process this image.")
            );
            return;
          }

          /*
            Draw the image on the canvas at the smaller size.
          */
          context.drawImage(
            image,
            0,
            0,
            width,
            height
          );

          /*
            Convert the resized image into a compressed JPEG.
          */
          const compressedDataUrl = canvas.toDataURL(
            "image/jpeg",
            IMAGE_QUALITY
          );

          if (!compressedDataUrl) {
            reject(
              new Error("Unable to compress image.")
            );
            return;
          }

          resolve({
            dataUrl: compressedDataUrl,
            width,
            height,
          });
        };

        image.onerror = () => {
          reject(
            new Error("Unable to process the selected image.")
          );
        };

        image.src = reader.result;
      };

      reader.onerror = () => {
        reject(
          new Error("Unable to read the selected image.")
        );
      };

      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);

    setImageError("");
    setError("");

    if (!files.length) {
      return;
    }

    const remainingSlots =
      MAX_GALLERY_IMAGES - galleryImages.length;

    if (remainingSlots <= 0) {
      setImageError(
        `You can upload a maximum of ${MAX_GALLERY_IMAGES} venue photos.`
      );

      e.target.value = "";
      return;
    }

    const filesToProcess = files.slice(
      0,
      remainingSlots
    );

    if (files.length > remainingSlots) {
      setImageError(
        `Only ${remainingSlots} more photo${
          remainingSlots === 1 ? "" : "s"
        } can be added.`
      );
    }

    const validFiles = [];

    for (const file of filesToProcess) {
      if (!file.type.startsWith("image/")) {
        setImageError(
          "Only image files can be uploaded."
        );
        continue;
      }

      const fileSizeMb =
        file.size / (1024 * 1024);

      if (fileSizeMb > MAX_IMAGE_SIZE_MB) {
        setImageError(
          `${file.name} is larger than ${MAX_IMAGE_SIZE_MB}MB.`
        );
        continue;
      }

      validFiles.push(file);
    }

    if (!validFiles.length) {
      e.target.value = "";
      return;
    }

    setIsProcessingImages(true);

    try {
      const convertedImages = [];

      for (const file of validFiles) {
        const compressed = await compressImage(file);

        convertedImages.push({
          id: `image_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 8)}`,

          name: file.name,

          originalType: file.type,

          originalSize: file.size,

          compressedSize: Math.round(
            (compressed.dataUrl.length * 3) / 4
          ),

          width: compressed.width,

          height: compressed.height,

          dataUrl: compressed.dataUrl,
        });
      }

      setGalleryImages((previous) => [
        ...previous,
        ...convertedImages,
      ]);
    } catch (processingError) {
      console.error(
        "Image processing error:",
        processingError
      );

      setImageError(
        "One or more images could not be processed. Please try another image."
      );
    } finally {
      setIsProcessingImages(false);
      e.target.value = "";
    }
  };

  const removeImage = (imageId) => {
    setGalleryImages((previous) =>
      previous.filter(
        (image) => image.id !== imageId
      )
    );

    setImageError("");
  };

  const setAsCoverImage = (imageId) => {
    setGalleryImages((previous) => {
      const selectedImage = previous.find(
        (image) => image.id === imageId
      );

      if (!selectedImage) {
        return previous;
      }

      const remainingImages = previous.filter(
        (image) => image.id !== imageId
      );

      return [
        selectedImage,
        ...remainingImages,
      ];
    });

    setImageError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setError("");
    setImageError("");

    if (!currentUser) {
      setError(
        "Please log in before registering your venue."
      );
      return;
    }

    if (!formData.businessName.trim()) {
      setError(
        "Please enter your venue/business name."
      );
      return;
    }

    if (!formData.ownerName.trim()) {
      setError(
        "Please enter the owner's name."
      );
      return;
    }

    if (!formData.email.trim()) {
      setError(
        "Please enter an email address."
      );
      return;
    }

    if (!formData.phone.trim()) {
      setError(
        "Please enter a phone number."
      );
      return;
    }

    if (!formData.venueType) {
      setError(
        "Please select a venue type."
      );
      return;
    }

    if (!formData.location.trim()) {
      setError(
        "Please enter the venue location."
      );
      return;
    }

    if (
      !formData.capacity ||
      Number(formData.capacity) <= 0
    ) {
      setError(
        "Please enter a valid venue capacity."
      );
      return;
    }

    if (
      formData.price === "" ||
      Number(formData.price) < 0
    ) {
      setError(
        "Please enter a valid starting price."
      );
      return;
    }

    if (galleryImages.length === 0) {
      setError(
        "Please upload at least one photo of your venue."
      );
      return;
    }

    let existingVenues = [];

    try {
      existingVenues = JSON.parse(
        localStorage.getItem(
          "eventflowVenues"
        ) || "[]"
      );
    } catch {
      existingVenues = [];
    }

    /*
      Prevent the same owner from registering
      the same venue twice.
    */
    const duplicateVenue =
      existingVenues.find(
        (venue) =>
          venue.ownerEmail?.toLowerCase() ===
            currentUser.email?.toLowerCase() &&
          venue.name?.toLowerCase() ===
            formData.businessName
              .trim()
              .toLowerCase()
      );

    if (duplicateVenue) {
      setError(
        "You have already registered this venue."
      );
      return;
    }

    setIsSubmitting(true);

    const now =
      new Date().toISOString();

    /*
      Only the compressed data URLs are saved.
    */
    const images =
      galleryImages.map(
        (image) => image.dataUrl
      );

    const newVenue = {
      id: `venue_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}`,

      ownerId: currentUser.id,

      ownerEmail:
        currentUser.email,

      ownerName:
        formData.ownerName.trim(),

      email:
        formData.email.trim(),

      phone:
        formData.phone.trim(),

      name:
        formData.businessName.trim(),

      businessName:
        formData.businessName.trim(),

      venueType:
        formData.venueType,

      location:
        formData.location.trim(),

      capacity:
        Number(formData.capacity),

      price:
        Number(formData.price),

      pricingType:
        "Starting from",

      description:
        formData.description.trim(),

      /*
        Important:
        The venue remains pending until the admin approves it.
      */
      status: "pending",

      /*
        Complete venue gallery.
      */
      images,

      /*
        Keep photos for compatibility with
        other EventFlow pages.
      */
      photos: images,

      /*
        First image is the cover image.
      */
      coverImage:
        images[0] || "",

      /*
        Legacy compatibility fields.
      */
      image:
        images[0] || "",

      imageUrl:
        images[0] || "",

      photo:
        images[0] || "",

      imageCount:
        images.length,

      createdAt:
        now,

      updatedAt:
        now,
    };

    try {
      const updatedVenues = [
        ...existingVenues,
        newVenue,
      ];

      /*
        Test the final JSON size before saving.
      */
      const serializedVenues =
        JSON.stringify(updatedVenues);

      localStorage.setItem(
        "eventflowVenues",
        serializedVenues
      );

      window.dispatchEvent(
        new Event(
          "eventflow-venues-updated"
        )
      );

      window.dispatchEvent(
        new CustomEvent(
          "eventflow-venue-registered",
          {
            detail: {
              venueId: newVenue.id,
            },
          }
        )
      );

      setSubmitted(true);
    } catch (storageError) {
      console.error(
        "Venue registration storage error:",
        storageError
      );

      /*
        If the browser still cannot store the data,
        explain what happened without losing the form.
      */
      setError(
        "The venue could not be saved because your browser storage is full. Please remove some old test venues from EventFlow and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <main className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
          <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
            <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 px-6 py-10 text-center text-white sm:px-10">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/15 ring-8 ring-white/10">
                <span className="text-4xl">
                  ✓
                </span>
              </div>

              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-100">
                EventFlow Venues
              </p>

              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                Venue Submitted
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
                Your venue profile and gallery
                have been submitted successfully.
                Our team will review the
                information before the venue is
                published on EventFlow.
              </p>
            </div>

            <div className="p-6 sm:p-10">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    ⏳
                  </div>

                  <div>
                    <p className="font-bold text-amber-900">
                      Pending approval
                    </p>

                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      Your venue will not appear
                      in public venue discovery
                      until it has been approved.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">
                  Your venue gallery
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {galleryImages.length} photo
                  {galleryImages.length === 1
                    ? ""
                    : "s"} uploaded
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {galleryImages
                    .slice(0, 8)
                    .map((image, index) => (
                      <div
                        key={image.id}
                        className="relative aspect-square overflow-hidden rounded-xl bg-slate-200"
                      >
                        <img
                          src={image.dataUrl}
                          alt={`Venue preview ${
                            index + 1
                          }`}
                          className="h-full w-full object-cover"
                        />

                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 rounded-full bg-slate-900/80 px-2 py-1 text-[10px] font-semibold text-white">
                            Cover
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  to="/dashboard/venue"
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-indigo-700"
                >
                  Go to Venue Dashboard
                </Link>

                <Link
                  to="/"
                  className="rounded-xl border border-slate-300 px-6 py-3 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link
              to="/dashboard/venue"
              className="transition hover:text-indigo-600"
            >
              Venue Dashboard
            </Link>

            <span>/</span>

            <span className="font-medium text-slate-700">
              Register Venue
            </span>
          </div>

          <div className="mt-5 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              EventFlow Venues
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Register your venue
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              Create a professional venue profile
              so event organizers can discover your
              space, review your facilities, and send
              booking requests.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            <span className="mt-0.5">!</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              {/* VENUE INFORMATION */}

              <section className="p-5 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xl">
                    🏢
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-950">
                      Venue information
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Give organizers the essential
                      details about your venue.
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Venue / Business Name *
                    </label>

                    <input
                      type="text"
                      name="businessName"
                      value={
                        formData.businessName
                      }
                      onChange={handleChange}
                      placeholder="e.g. Royal Gardens Event Centre"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Venue Type *
                    </label>

                    <select
                      name="venueType"
                      value={
                        formData.venueType
                      }
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    >
                      <option value="">
                        Select venue type
                      </option>

                      <option value="Event Hall">
                        Event Hall
                      </option>

                      <option value="Wedding Venue">
                        Wedding Venue
                      </option>

                      <option value="Conference Centre">
                        Conference Centre
                      </option>

                      <option value="Outdoor Venue">
                        Outdoor Venue
                      </option>

                      <option value="Garden">
                        Garden
                      </option>

                      <option value="Beach Venue">
                        Beach Venue
                      </option>

                      <option value="Hotel">
                        Hotel
                      </option>

                      <option value="Restaurant">
                        Restaurant
                      </option>

                      <option value="Church">
                        Church
                      </option>

                      <option value="Community Centre">
                        Community Centre
                      </option>

                      <option value="Other">
                        Other
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Location *
                    </label>

                    <input
                      type="text"
                      name="location"
                      value={
                        formData.location
                      }
                      onChange={handleChange}
                      placeholder="e.g. Kumasi, Ashanti Region"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Maximum Capacity *
                    </label>

                    <input
                      type="number"
                      name="capacity"
                      min="1"
                      value={
                        formData.capacity
                      }
                      onChange={handleChange}
                      placeholder="e.g. 500"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Starting Price (GH₵) *
                    </label>

                    <input
                      type="number"
                      name="price"
                      min="0"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="e.g. 5000"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    />

                    <p className="mt-2 text-xs text-slate-500">
                      This is a starting price. The
                      final price can be agreed after
                      reviewing the organizer's
                      requirements.
                    </p>
                  </div>
                </div>
              </section>

              {/* GALLERY */}

              <section className="border-t border-slate-200 p-5 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-xl">
                    🖼️
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-950">
                      Venue gallery
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Upload clear photos of your
                      venue so organizers can see the
                      space before making an enquiry.
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={
                      handleImageUpload
                    }
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    disabled={
                      galleryImages.length >=
                        MAX_GALLERY_IMAGES ||
                      isProcessingImages
                    }
                    className="group flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                      {isProcessingImages
                        ? "⏳"
                        : "📷"}
                    </span>

                    <span className="mt-4 text-sm font-bold text-slate-900">
                      {isProcessingImages
                        ? "Optimizing photos..."
                        : galleryImages.length >=
                          MAX_GALLERY_IMAGES
                        ? "Maximum photos uploaded"
                        : "Add venue photos"}
                    </span>

                    <span className="mt-1 text-xs text-slate-500">
                      JPG, PNG or WEBP · Up to{" "}
                      {MAX_GALLERY_IMAGES} photos
                    </span>

                    <span className="mt-1 text-xs text-slate-400">
                      Photos are automatically
                      resized and compressed
                    </span>
                  </button>

                  {imageError && (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      {imageError}
                    </div>
                  )}

                  {galleryImages.length > 0 && (
                    <div className="mt-6">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            Uploaded photos
                          </p>

                          <p className="text-xs text-slate-500">
                            The first photo is used
                            as your venue cover.
                          </p>
                        </div>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          {
                            galleryImages.length
                          }
                          /
                          {
                            MAX_GALLERY_IMAGES
                          }
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {galleryImages.map(
                          (
                            image,
                            index
                          ) => (
                            <div
                              key={
                                image.id
                              }
                              className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-200"
                            >
                              <img
                                src={
                                  image.dataUrl
                                }
                                alt={`Venue photo ${
                                  index +
                                  1
                                }`}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                              />

                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10 opacity-0 transition group-hover:opacity-100" />

                              {index ===
                                0 && (
                                <span className="absolute left-2 top-2 rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                                  Cover photo
                                </span>
                              )}

                              <div className="absolute bottom-2 left-2 right-2 flex gap-2 opacity-0 transition group-hover:opacity-100">
                                {index !==
                                  0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setAsCoverImage(
                                        image.id
                                      )
                                    }
                                    className="flex-1 rounded-lg bg-white/95 px-2 py-2 text-[10px] font-bold text-slate-800 shadow-sm"
                                  >
                                    Set Cover
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeImage(
                                      image.id
                                    )
                                  }
                                  className="rounded-lg bg-red-600 px-3 py-2 text-[10px] font-bold text-white shadow-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 rounded-xl bg-indigo-50 px-4 py-3 text-xs leading-5 text-indigo-800">
                  <strong>
                    Photo tip:
                  </strong>{" "}
                  Upload photos that clearly show
                  the entrance, main event space,
                  seating area, outdoor areas,
                  parking and other facilities
                  organizers may need.
                </div>
              </section>

              {/* OWNER INFORMATION */}

              <section className="border-t border-slate-200 p-5 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-xl">
                    👤
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-950">
                      Owner / contact information
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      These details help EventFlow
                      and organizers contact you about
                      enquiries and bookings.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Owner Name *
                    </label>

                    <input
                      type="text"
                      name="ownerName"
                      value={
                        formData.ownerName
                      }
                      onChange={handleChange}
                      placeholder="Full name"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Email *
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={
                        formData.email
                      }
                      onChange={handleChange}
                      placeholder="venue@example.com"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Phone Number *
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={
                        formData.phone
                      }
                      onChange={handleChange}
                      placeholder="e.g. 024 123 4567"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>
                </div>
              </section>

              {/* DESCRIPTION */}

              <section className="border-t border-slate-200 p-5 sm:p-8">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Venue Description
                </label>

                <textarea
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={handleChange}
                  rows="6"
                  placeholder="Describe your venue, facilities, parking, seating arrangements, decoration options, accessibility, catering options, and anything else organizers should know."
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                />

                <p className="mt-2 text-xs text-slate-500">
                  A clear description helps organizers
                  understand what your venue offers.
                </p>
              </section>

              {/* APPROVAL */}

              <section className="border-t border-slate-200 p-5 sm:p-8">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                      ✓
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        What happens after registration?
                      </h3>

                      <div className="mt-3 space-y-3 text-sm text-slate-600">
                        <div className="flex gap-3">
                          <span className="font-bold text-indigo-600">
                            01
                          </span>

                          <span>
                            Your venue information
                            and photos are saved
                            to your EventFlow
                            profile.
                          </span>
                        </div>

                        <div className="flex gap-3">
                          <span className="font-bold text-indigo-600">
                            02
                          </span>

                          <span>
                            Your venue is placed
                            under review and
                            remains pending until
                            approved.
                          </span>
                        </div>

                        <div className="flex gap-3">
                          <span className="font-bold text-indigo-600">
                            03
                          </span>

                          <span>
                            Once approved, your
                            venue profile and
                            gallery can appear in
                            EventFlow venue
                            discovery.
                          </span>
                        </div>

                        <div className="flex gap-3">
                          <span className="font-bold text-indigo-600">
                            04
                          </span>

                          <span>
                            Organizers can view
                            your venue and send
                            booking requests based
                            on their event
                            requirements.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* BUTTONS */}

              <div className="border-t border-slate-200 bg-slate-50/70 p-5 sm:p-8">
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Link
                    to="/dashboard/venue"
                    className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      isProcessingImages
                    }
                    className="rounded-xl bg-indigo-600 px-6 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isProcessingImages
                      ? "Processing photos..."
                      : isSubmitting
                      ? "Submitting venue..."
                      : "Submit Venue for Review"}
                  </button>
                </div>
              </div>
            </div>

            {/* SIDEBAR */}

            <aside className="space-y-5">
              <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-700 to-violet-700 p-6 text-white shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-xl">
                  ✨
                </div>

                <h2 className="mt-5 text-xl font-bold">
                  Build a strong venue profile
                </h2>

                <p className="mt-2 text-sm leading-6 text-indigo-100">
                  Good photos and accurate
                  information help organizers
                  understand your venue before they
                  send a booking request.
                </p>

                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex gap-3">
                    <span>✓</span>
                    <span>
                      Use clear, recent venue photos
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <span>✓</span>
                    <span>
                      Show different areas of the
                      venue
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <span>✓</span>
                    <span>
                      Give an accurate maximum
                      capacity
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <span>✓</span>
                    <span>
                      Describe important facilities
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Registration checklist
                </p>

                <div className="mt-5 space-y-4">
                  <ChecklistItem
                    done={Boolean(
                      formData.businessName.trim()
                    )}
                    label="Venue name"
                  />

                  <ChecklistItem
                    done={Boolean(
                      formData.venueType
                    )}
                    label="Venue type"
                  />

                  <ChecklistItem
                    done={Boolean(
                      formData.location.trim()
                    )}
                    label="Location"
                  />

                  <ChecklistItem
                    done={
                      Boolean(
                        formData.capacity
                      ) &&
                      Number(
                        formData.capacity
                      ) > 0
                    }
                    label="Venue capacity"
                  />

                  <ChecklistItem
                    done={
                      formData.price !== ""
                    }
                    label="Starting price"
                  />

                  <ChecklistItem
                    done={
                      galleryImages.length > 0
                    }
                    label={`Venue photos (${galleryImages.length})`}
                  />

                  <ChecklistItem
                    done={Boolean(
                      formData.phone.trim()
                    )}
                    label="Contact information"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-bold text-slate-900">
                  Need to update your venue later?
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Your venue dashboard will be the
                  central place to manage your profile,
                  services, booking requests and
                  business activity.
                </p>
              </div>
            </aside>
          </div>
        </form>
      </main>
    </div>
  );
}

function ChecklistItem({ done, label }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          done
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        {done ? "✓" : "•"}
      </div>

      <span
        className={`text-sm ${
          done
            ? "font-semibold text-slate-800"
            : "text-slate-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
