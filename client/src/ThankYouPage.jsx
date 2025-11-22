// src/ThankYouPage.js
import React from "react";

function ThankYouPage() {
  return (
    <div className="container my-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-sm">
            <div className="card-body text-center py-5">
              <h3 className="mb-3">Thanks for applying!</h3>
              <p className="text-muted mb-4">
                Your response has been recorded. You may now close this tab, or
                submit another response if the organizer has allowed it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThankYouPage;
