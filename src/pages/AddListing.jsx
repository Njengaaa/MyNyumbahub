import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { AREA_COORDS, AREA_NAMES } from '../areaCoords';
import './AddListing.css';

function AddListing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [area, setArea] = useState(AREA_NAMES[0]);
  const [rentAmount, setRentAmount] = useState('');
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const coords = AREA_COORDS[area];

    const { error: insertError } = await supabase.from('listings').insert({
      landlord_id: user.id,
      title,
      area,
      city: coords.city,
      lat: coords.lat,
      lng: coords.lng,
      rent_amount: Number(rentAmount),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      description,
      images: imageUrl ? [imageUrl] : [],
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    navigate('/dashboard/landlord');
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
          <label htmlFor="image">Image URL (optional)</label>
          <input
            id="image"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
          />
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
          {submitting ? 'Publishing…' : 'Publish listing'}
        </button>
      </form>
    </div>
  );
}

export default AddListing;
