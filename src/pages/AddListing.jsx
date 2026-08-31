import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { AREA_COORDS, AREA_NAMES } from '../areaCoords';
import './AddListing.css';

const MAX_PHOTOS = 6;

async function uploadPhotos(files, userId, onProgress) {
  const uploadedUrls = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress(`Compressing photo ${i + 1} of ${files.length}…`);

    const compressed = await imageCompression(file, {
      maxSizeMB: 0.4,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
    });

    const fileExt = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    onProgress(`Uploading photo ${i + 1} of ${files.length}…`);

    const { error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(path, compressed, {
        cacheControl: '31536000', // 1 year — safe since each upload gets a unique path
        contentType: compressed.type || file.type,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from('listing-images').getPublicUrl(path);
    uploadedUrls.push(publicUrlData.publicUrl);
  }

  return uploadedUrls;
}

function AddListing() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [listingType, setListingType] = useState('rent'); // 'rent' | 'sale'
  const [title, setTitle] = useState('');
  const [area, setArea] = useState(AREA_NAMES[0]);
  const [rentAmount, setRentAmount] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');

  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [photoError, setPhotoError] = useState('');

  const [error, setError] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Prefill phone from the existing profile once it loads.
  useEffect(() => {
    if (profile?.phone) setPhone(profile.phone);
  }, [profile]);

  // Generate/clean up local preview URLs whenever the selected photo set changes.
  useEffect(() => {
    const urls = photos.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [photos]);

  const handlePhotoSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    setPhotoError('');
    setPhotos((prev) => {
      const combined = [...prev, ...selected];
      if (combined.length > MAX_PHOTOS) {
        setPhotoError(`You can upload up to ${MAX_PHOTOS} photos — kept the first ${MAX_PHOTOS}.`);
      }
      return combined.slice(0, MAX_PHOTOS);
    });

    e.target.value = ''; // allow re-selecting the same file later
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    setUploadStatus('');

    try {
      // Save the phone number to the profile if it's new or changed.
      if (phone.trim() && phone.trim() !== (profile?.phone || '')) {
        const { error: phoneError } = await supabase
          .from('profiles')
          .update({ phone: phone.trim() })
          .eq('id', user.id);
        if (phoneError) throw phoneError;
      }

      let imageUrls = [];
      if (photos.length > 0) {
        imageUrls = await uploadPhotos(photos, user.id, setUploadStatus);
      }

      setUploadStatus('Publishing listing…');

      const coords = AREA_COORDS[area];

      const { error: insertError } = await supabase.from('listings').insert({
        landlord_id: user.id,
        title,
        area,
        city: coords.city,
        lat: coords.lat,
        lng: coords.lng,
        listing_type: listingType,
        rent_amount: listingType === 'rent' ? Number(rentAmount) : null,
        sale_price: listingType === 'sale' ? Number(salePrice) : null,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        description,
        images: imageUrls,
      });

      if (insertError) throw insertError;

      navigate('/dashboard/landlord');
    } catch (err) {
      setError(err.message || 'Could not publish listing.');
    } finally {
      setSubmitting(false);
      setUploadStatus('');
    }
  };

  return (
    <div className="add-listing container">
      <h1>Add a listing</h1>
      <p className="add-listing-sub">
        Pick a neighbourhood — we&rsquo;ll place the pin on the map automatically.
      </p>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={handleSubmit} className="add-listing-form">
        <div className="form-field">
          <label>Listing type</label>
          <div className="listing-type-toggle">
            <button
              type="button"
              className={listingType === 'rent' ? 'active' : ''}
              onClick={() => setListingType('rent')}
            >
              For Rent
            </button>
            <button
              type="button"
              className={listingType === 'sale' ? 'active' : ''}
              onClick={() => setListingType('sale')}
            >
              For Sale
            </button>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 2 Bedroom Apartment"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="area">Area</label>
            <select id="area" value={area} onChange={(e) => setArea(e.target.value)}>
              {AREA_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name} ({AREA_COORDS[name].city})
                </option>
              ))}
            </select>
          </div>
          {listingType === 'rent' ? (
            <div className="form-field">
              <label htmlFor="rent">Rent (KES/month)</label>
              <input
                id="rent"
                type="number"
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value)}
                required
                min="0"
              />
            </div>
          ) : (
            <div className="form-field">
              <label htmlFor="salePrice">Sale price (KES)</label>
              <input
                id="salePrice"
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                required
                min="0"
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="bedrooms">Bedrooms</label>
            <input
              id="bedrooms"
              type="number"
              min="0"
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="bathrooms">Bathrooms</label>
            <input
              id="bathrooms"
              type="number"
              min="0"
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="phone">Contact phone</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 07XX XXX XXX"
          />
          <p className="field-hint">
            Shown to tenants on this and all your listings so they can call you directly.
          </p>
        </div>

        <div className="form-field">
          <label>Photos</label>
          <div className="photo-upload-grid">
            {previews.map((src, i) => (
              <div key={src} className="photo-thumb">
                <img src={src} alt={`Upload preview ${i + 1}`} />
                <button
                  type="button"
                  className="photo-thumb-remove"
                  onClick={() => removePhoto(i)}
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}

            {photos.length < MAX_PHOTOS && (
              <label className="photo-upload-slot" htmlFor="photos">
                <span className="photo-upload-icon">+</span>
                <span>Add photo</span>
              </label>
            )}
          </div>
          <input
            id="photos"
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoSelect}
            className="photo-upload-input"
          />
          <p className="field-hint">
            Up to {MAX_PHOTOS} photos. They&rsquo;ll be resized and compressed automatically before
            upload.
          </p>
          {photoError && <p className="field-error">{photoError}</p>}
        </div>

        <div className="form-field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the property…"
          />
        </div>

        <button type="submit" className="btn btn-gold" disabled={submitting}>
          {submitting ? uploadStatus || 'Publishing…' : 'Publish listing'}
        </button>
      </form>
    </div>
  );
}

export default AddListing;