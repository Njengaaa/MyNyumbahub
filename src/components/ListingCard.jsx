import { Link } from 'react-router-dom';
import './ListingCard.css';

function ListingCard({ listing }) {
  const cover = listing.images?.[0];
  const isSale = listing.listing_type === 'sale';

  return (
    <Link to={`/listings/${listing.id}`} className="listing-card">
      <div className="listing-card-image-wrap">
        {cover ? (
          <img src={cover} alt={listing.title} className="listing-card-image" />
        ) : (
          <div className="listing-card-image listing-card-image-placeholder" />
        )}
        <span className="listing-card-price">
          {isSale
            ? `KES ${listing.sale_price?.toLocaleString()}`
            : `KES ${listing.rent_amount?.toLocaleString()}/mo`}
        </span>
        <span className={`listing-card-type-tag ${isSale ? 'tag-sale' : 'tag-rent'}`}>
          {isSale ? 'For Sale' : 'For Rent'}
        </span>
      </div>
      <div className="listing-card-body">
        <h4>{listing.title}</h4>
        <p className="listing-card-location">
          {listing.area}, {listing.city}
        </p>
        <p className="listing-card-meta">
          {listing.bedrooms} bed · {listing.bathrooms} bath
        </p>
      </div>
    </Link>
  );
}

export default ListingCard;