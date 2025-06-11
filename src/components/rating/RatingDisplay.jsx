import { Star } from "lucide-react";

const RatingDisplay = ({ averageRating, totalRatings, showComment = true, starSize = 32 }) => {
  const getRatingComment = (rating) => {
    if (rating >= 4.5) return "Exceptional quality and service!";
    if (rating >= 4.0) return "Great food and reliable service";
    if (rating >= 3.5) return "Good food with room for improvement";
    if (rating >= 3.0) return "Average experience";
    return "Working to improve our service";
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "var(--spacing-2)", marginBottom: "var(--spacing-2)" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={starSize}
            fill={star <= Math.round(averageRating) ? "gold" : "none"}
            color={star <= Math.round(averageRating) ? "gold" : "var(--border)"}
          />
        ))}
      </div>
      <div style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "var(--spacing-1)" }}>
        {averageRating.toFixed(1)} out of 5
      </div>
      {showComment && (
        <p style={{ color: "var(--muted-foreground)" }}>
          {getRatingComment(averageRating)}
        </p>
      )}
      <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", marginTop: "var(--spacing-1)" }}>
        Based on {totalRatings} customer reviews
      </p>
    </div>
  );
};

export default RatingDisplay;