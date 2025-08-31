class BookingModal {
    constructor() {
        this.currentFlight = null;
        this.passengers = [];
        this.currentStep = 1;
        this.totalSteps = 3;
        this.initializeModal();
    }

    initializeModal() {
        // Create modal HTML structure
        const modalHTML = `
            <div id="bookingModal" class="booking-modal" style="display: none;">
                <div class="modal-overlay" onclick="this.closest('.booking-modal').style.display='none'"></div>
                <div class="modal-container">
                    <div class="modal-header">
                        <h2 id="modalTitle">הזמנת טיסה</h2>
                        <button class="modal-close" onclick="document.getElementById('bookingModal').style.display='none'">&times;</button>
                    </div>
                    
                    <div class="progress-bar">
                        <div class="progress-step active" data-step="1">
                            <span class="step-number">1</span>
                            <span class="step-label">פרטי טיסה</span>
                        </div>
                        <div class="progress-step" data-step="2">
                            <span class="step-number">2</span>
                            <span class="step-label">פרטי נוסעים</span>
                        </div>
                        <div class="progress-step" data-step="3">
                            <span class="step-number">3</span>
                            <span class="step-label">תשלום</span>
                        </div>
                    </div>

                    <div class="modal-content">
                        <!-- Step 1: Flight Details -->
                        <div id="step1" class="step-content active">
                            <div class="flight-summary">
                                <h3>סיכום טיסה</h3>
                                <div id="flightDetailsDisplay"></div>
                            </div>
                        </div>

                        <!-- Step 2: Passenger Details -->
                        <div id="step2" class="step-content">
                            <div class="passengers-section">
                                <h3>פרטי נוסעים</h3>
                                <div id="passengersContainer"></div>
                                <button type="button" class="add-passenger-btn" onclick="bookingModal.addPassenger()">
                                    + הוסף נוסע
                                </button>
                            </div>
                            
                            <div class="contact-details">
                                <h3>פרטי יצירת קשר</h3>
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label for="contactEmail">אימייל *</label>
                                        <input type="email" id="contactEmail" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="contactPhone">טלפון *</label>
                                        <input type="tel" id="contactPhone" required>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Step 3: Payment -->
                        <div id="step3" class="step-content">
                            <div class="payment-summary">
                                <h3>סיכום הזמנה</h3>
                                <div id="orderSummary"></div>
                            </div>
                            
                            <div class="payment-methods">
                                <h3>אמצעי תשלום</h3>
                                <div class="payment-options">
                                    <label class="payment-option">
                                        <input type="radio" name="paymentMethod" value="stripe" checked>
                                        <span class="payment-icon">💳</span>
                                        <span>כרטיס אשראי (Stripe)</span>
                                    </label>
                                    <label class="payment-option">
                                        <input type="radio" name="paymentMethod" value="paypal">
                                        <span class="payment-icon">🅿️</span>
                                        <span>PayPal</span>
                                    </label>
                                </div>
                            </div>

                            <div class="security-notice">
                                🔒 <strong>תשלום מאובטח:</strong> כל הפרטים מוצפנים ומועברים בחיבור מאובטח SSL
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button id="prevBtn" class="btn btn-secondary" onclick="bookingModal.previousStep()" style="display: none;">
                            ← קודם
                        </button>
                        <div class="spacer"></div>
                        <button id="nextBtn" class="btn btn-primary" onclick="bookingModal.nextStep()">
                            הבא →
                        </button>
                        <button id="bookBtn" class="btn btn-success" onclick="bookingModal.completePurchase()" style="display: none;">
                            💳 שלם עכשיו
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Inject modal into the page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.injectStyles();
    }

    injectStyles() {
        const styles = `
            <style>
                .booking-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10000;
                    font-family: system-ui, -apple-system, sans-serif;
                }

                .modal-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(5px);
                }

                .modal-container {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    border-radius: 16px;
                    width: 90%;
                    max-width: 800px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    direction: rtl;
                }

                .modal-header {
                    padding: 24px;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-header h2 {
                    margin: 0;
                    color: #1f2937;
                    font-size: 24px;
                }

                .modal-close {
                    background: none;
                    border: none;
                    font-size: 32px;
                    cursor: pointer;
                    color: #6b7280;
                    padding: 0;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .modal-close:hover {
                    background: #f3f4f6;
                    color: #1f2937;
                }

                .progress-bar {
                    display: flex;
                    padding: 24px;
                    background: #f9fafb;
                    border-bottom: 1px solid #e5e7eb;
                    justify-content: center;
                    gap: 60px;
                }

                .progress-step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    opacity: 0.5;
                    transition: all 0.3s;
                }

                .progress-step.active {
                    opacity: 1;
                }

                .progress-step.completed {
                    opacity: 1;
                    color: #059669;
                }

                .step-number {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #e5e7eb;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    color: #6b7280;
                    transition: all 0.3s;
                }

                .progress-step.active .step-number {
                    background: #3b82f6;
                    color: white;
                }

                .progress-step.completed .step-number {
                    background: #059669;
                    color: white;
                }

                .step-label {
                    font-size: 14px;
                    font-weight: 500;
                    color: #6b7280;
                }

                .progress-step.active .step-label,
                .progress-step.completed .step-label {
                    color: #1f2937;
                }

                .modal-content {
                    padding: 24px;
                    min-height: 400px;
                }

                .step-content {
                    display: none;
                }

                .step-content.active {
                    display: block;
                }

                .flight-summary {
                    background: #f0f9ff;
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid #0ea5e9;
                }

                .flight-summary h3 {
                    margin: 0 0 16px 0;
                    color: #0c4a6e;
                }

                .form-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .form-group label {
                    font-weight: 600;
                    color: #374151;
                    font-size: 14px;
                }

                .form-group input,
                .form-group select {
                    padding: 12px;
                    border: 2px solid #d1d5db;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: border-color 0.2s;
                }

                .form-group input:focus,
                .form-group select:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .passenger-card {
                    background: #ffffff;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 16px;
                    position: relative;
                }

                .passenger-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .passenger-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #1f2937;
                }

                .remove-passenger {
                    background: #ef4444;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    cursor: pointer;
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .add-passenger-btn {
                    background: #10b981;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    margin: 16px 0;
                    transition: all 0.2s;
                }

                .add-passenger-btn:hover {
                    background: #059669;
                    transform: translateY(-1px);
                }

                .contact-details {
                    margin-top: 32px;
                    padding-top: 24px;
                    border-top: 1px solid #e5e7eb;
                }

                .contact-details h3 {
                    margin: 0 0 16px 0;
                    color: #1f2937;
                }

                .payment-methods {
                    margin: 24px 0;
                }

                .payment-methods h3 {
                    margin: 0 0 16px 0;
                    color: #1f2937;
                }

                .payment-options {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .payment-option {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .payment-option:hover {
                    border-color: #3b82f6;
                    background: #f0f9ff;
                }

                .payment-option input[type="radio"] {
                    width: 20px;
                    height: 20px;
                }

                .payment-icon {
                    font-size: 24px;
                }

                .security-notice {
                    background: #f0fdf4;
                    border: 1px solid #22c55e;
                    border-radius: 8px;
                    padding: 12px;
                    margin: 24px 0;
                    font-size: 14px;
                    color: #166534;
                }

                .order-summary {
                    background: #fefce8;
                    border: 1px solid #eab308;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 24px;
                }

                .order-line {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    padding-bottom: 8px;
                }

                .order-total {
                    border-top: 2px solid #eab308;
                    padding-top: 12px;
                    font-size: 18px;
                    font-weight: 700;
                    color: #92400e;
                }

                .modal-footer {
                    padding: 24px;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }

                .spacer {
                    flex: 1;
                }

                .btn {
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                }

                .btn-secondary {
                    background: #f3f4f6;
                    color: #374151;
                }

                .btn-secondary:hover {
                    background: #e5e7eb;
                }

                .btn-primary {
                    background: #3b82f6;
                    color: white;
                }

                .btn-primary:hover {
                    background: #2563eb;
                    transform: translateY(-1px);
                }

                .btn-success {
                    background: #10b981;
                    color: white;
                    font-size: 18px;
                    padding: 16px 32px;
                }

                .btn-success:hover {
                    background: #059669;
                    transform: translateY(-1px);
                    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
                }

                @media (max-width: 768px) {
                    .modal-container {
                        width: 95%;
                        margin: 20px;
                    }

                    .progress-bar {
                        gap: 30px;
                    }

                    .form-grid {
                        grid-template-columns: 1fr;
                    }

                    .modal-footer {
                        flex-direction: column-reverse;
                        gap: 16px;
                    }

                    .modal-footer .spacer {
                        display: none;
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    openModal(flight) {
        this.currentFlight = flight;
        this.passengers = [this.createEmptyPassenger()]; // Start with one passenger
        this.currentStep = 1;
        
        // Update modal title and flight details
        document.getElementById('modalTitle').textContent = `הזמנת טיסה - ${flight.destination.city}`;
        this.displayFlightDetails();
        this.displayPassengers();
        
        // Show modal
        document.getElementById('bookingModal').style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    displayFlightDetails() {
        const container = document.getElementById('flightDetailsDisplay');
        if (!this.currentFlight) return;

        const flight = this.currentFlight;
        container.innerHTML = `
            <div class="flight-detail-row">
                <strong>🛫 טיסה:</strong> ${flight.airline} ${flight.flightNumber}
            </div>
            <div class="flight-detail-row">
                <strong>📍 מסלול:</strong> ${flight.origin.city} → ${flight.destination.city}
            </div>
            <div class="flight-detail-row">
                <strong>⏰ יציאה:</strong> ${this.formatDateTime(flight.departure)}
            </div>
            <div class="flight-detail-row">
                <strong>🛬 הגעה:</strong> ${this.formatDateTime(flight.arrival)}
            </div>
            <div class="flight-detail-row">
                <strong>💰 מחיר:</strong> ${flight.price.formatted}
            </div>
            <div class="flight-detail-row">
                <strong>🎫 מחלקה:</strong> ${flight.class}
            </div>
        `;
    }

    displayPassengers() {
        const container = document.getElementById('passengersContainer');
        container.innerHTML = '';

        this.passengers.forEach((passenger, index) => {
            const passengerHTML = `
                <div class="passenger-card">
                    <div class="passenger-header">
                        <h4 class="passenger-title">נוסע ${index + 1}</h4>
                        ${this.passengers.length > 1 ? `<button class="remove-passenger" onclick="bookingModal.removePassenger(${index})">×</button>` : ''}
                    </div>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>שם פרטי *</label>
                            <input type="text" data-passenger="${index}" data-field="firstName" value="${passenger.firstName}" required>
                        </div>
                        <div class="form-group">
                            <label>שם משפחה *</label>
                            <input type="text" data-passenger="${index}" data-field="lastName" value="${passenger.lastName}" required>
                        </div>
                        <div class="form-group">
                            <label>תאריך לידה *</label>
                            <input type="date" data-passenger="${index}" data-field="dateOfBirth" value="${passenger.dateOfBirth}" required>
                        </div>
                        <div class="form-group">
                            <label>מין</label>
                            <select data-passenger="${index}" data-field="gender">
                                <option value="M" ${passenger.gender === 'M' ? 'selected' : ''}>זכר</option>
                                <option value="F" ${passenger.gender === 'F' ? 'selected' : ''}>נקבה</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>דרכון/תעודת זהות *</label>
                            <input type="text" data-passenger="${index}" data-field="documentNumber" value="${passenger.documentNumber}" required>
                        </div>
                        <div class="form-group">
                            <label>אזרחות</label>
                            <select data-passenger="${index}" data-field="nationality">
                                <option value="IL" ${passenger.nationality === 'IL' ? 'selected' : ''}>ישראלית</option>
                                <option value="US" ${passenger.nationality === 'US' ? 'selected' : ''}>אמריקאית</option>
                                <option value="GB" ${passenger.nationality === 'GB' ? 'selected' : ''}>בריטית</option>
                                <option value="DE" ${passenger.nationality === 'DE' ? 'selected' : ''}>גרמנית</option>
                                <option value="FR" ${passenger.nationality === 'FR' ? 'selected' : ''}>צרפתית</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', passengerHTML);
        });

        // Add event listeners to update passenger data
        container.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', (e) => {
                const passengerIndex = parseInt(e.target.dataset.passenger);
                const field = e.target.dataset.field;
                this.passengers[passengerIndex][field] = e.target.value;
            });
        });
    }

    createEmptyPassenger() {
        return {
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            gender: 'M',
            documentNumber: '',
            nationality: 'IL'
        };
    }

    addPassenger() {
        this.passengers.push(this.createEmptyPassenger());
        this.displayPassengers();
    }

    removePassenger(index) {
        if (this.passengers.length > 1) {
            this.passengers.splice(index, 1);
            this.displayPassengers();
        }
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            if (this.validateCurrentStep()) {
                this.currentStep++;
                this.updateStepDisplay();
            }
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }

    updateStepDisplay() {
        // Update progress bar
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.remove('active', 'completed');
            
            if (stepNumber < this.currentStep) {
                step.classList.add('completed');
            } else if (stepNumber === this.currentStep) {
                step.classList.add('active');
            }
        });

        // Update step content
        document.querySelectorAll('.step-content').forEach((content, index) => {
            const stepNumber = index + 1;
            content.classList.remove('active');
            
            if (stepNumber === this.currentStep) {
                content.classList.add('active');
            }
        });

        // Update buttons
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const bookBtn = document.getElementById('bookBtn');

        prevBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
        
        if (this.currentStep === this.totalSteps) {
            nextBtn.style.display = 'none';
            bookBtn.style.display = 'block';
            this.displayOrderSummary();
        } else {
            nextBtn.style.display = 'block';
            bookBtn.style.display = 'none';
        }
    }

    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                return true; // Flight details are pre-filled
            case 2:
                return this.validatePassengers();
            case 3:
                return this.validatePayment();
            default:
                return true;
        }
    }

    validatePassengers() {
        // Check if all required passenger fields are filled
        const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'documentNumber'];
        const contactEmail = document.getElementById('contactEmail').value;
        const contactPhone = document.getElementById('contactPhone').value;

        if (!contactEmail || !contactPhone) {
            alert('אנא מלאו את פרטי יצירת הקשר');
            return false;
        }

        for (let passenger of this.passengers) {
            for (let field of requiredFields) {
                if (!passenger[field] || passenger[field].trim() === '') {
                    alert(`אנא מלאו את כל הפרטים הנדרשים עבור כל הנוסעים`);
                    return false;
                }
            }
        }

        return true;
    }

    validatePayment() {
        const selectedPayment = document.querySelector('input[name="paymentMethod"]:checked');
        return selectedPayment !== null;
    }

    displayOrderSummary() {
        const container = document.getElementById('orderSummary');
        const basePrice = this.currentFlight.price.amount || 500;
        const totalPassengers = this.passengers.length;
        const subtotal = basePrice * totalPassengers;
        const taxes = Math.round(subtotal * 0.15);
        const total = subtotal + taxes;

        container.innerHTML = `
            <div class="order-summary">
                <div class="order-line">
                    <span>טיסה ${this.currentFlight.origin.city} → ${this.currentFlight.destination.city}</span>
                    <span>$${basePrice}</span>
                </div>
                <div class="order-line">
                    <span>נוסעים (${totalPassengers})</span>
                    <span>$${subtotal}</span>
                </div>
                <div class="order-line">
                    <span>מסים ועמלות</span>
                    <span>$${taxes}</span>
                </div>
                <div class="order-line order-total">
                    <span><strong>סה״כ לתשלום</strong></span>
                    <span><strong>$${total}</strong></span>
                </div>
            </div>
        `;
    }

    async completePurchase() {
        const selectedPayment = document.querySelector('input[name="paymentMethod"]:checked').value;
        const contactEmail = document.getElementById('contactEmail').value;
        const contactPhone = document.getElementById('contactPhone').value;

        // Show loading state
        const bookBtn = document.getElementById('bookBtn');
        const originalText = bookBtn.innerHTML;
        bookBtn.innerHTML = '⏳ מעבד תשלום...';
        bookBtn.disabled = true;

        try {
            // Prepare booking data
            const bookingData = {
                flight: this.currentFlight,
                passengers: this.passengers,
                contact: {
                    email: contactEmail,
                    phone: contactPhone
                },
                paymentMethod: selectedPayment
            };

            // Call booking API
            const response = await fetch('/api/flights/book-real', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookingData)
            });

            const result = await response.json();

            if (result.success) {
                if (selectedPayment === 'stripe') {
                    await this.processStripePayment(result);
                } else if (selectedPayment === 'paypal') {
                    await this.processPayPalPayment(result);
                }
            } else {
                throw new Error(result.error || 'Booking failed');
            }

        } catch (error) {
            console.error('Booking error:', error);
            alert(`שגיאה בהזמנה: ${error.message}`);
            
            // Restore button
            bookBtn.innerHTML = originalText;
            bookBtn.disabled = false;
        }
    }

    async processStripePayment(bookingData) {
        try {
            // Load Stripe.js if not already loaded
            if (!window.Stripe) {
                await this.loadStripeJS();
            }

            const stripe = Stripe(bookingData.stripePublicKey);
            const totalAmount = this.calculateTotalAmount();

            // Create payment intent on server
            const response = await fetch('/api/payments/create-stripe-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bookingId: bookingData.bookingId,
                    amount: totalAmount,
                    currency: 'usd',
                    customerEmail: document.getElementById('contactEmail').value
                })
            });

            const { clientSecret, error } = await response.json();
            if (error) throw new Error(error);

            // Confirm payment
            const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: await this.createStripeCardElement(stripe),
                    billing_details: {
                        name: this.passengers[0].firstName + ' ' + this.passengers[0].lastName,
                        email: document.getElementById('contactEmail').value,
                        phone: document.getElementById('contactPhone').value
                    }
                }
            });

            if (stripeError) {
                throw new Error(stripeError.message);
            }

            this.showSuccessMessage(bookingData);

        } catch (error) {
            console.error('Stripe payment error:', error);
            throw error;
        }
    }

    async processPayPalPayment(bookingData) {
        try {
            // Load PayPal SDK if not already loaded
            if (!window.paypal) {
                await this.loadPayPalSDK();
            }

            const totalAmount = this.calculateTotalAmount();

            // Create PayPal payment
            const response = await fetch('/api/payments/create-paypal-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bookingId: bookingData.bookingId,
                    amount: totalAmount,
                    currency: 'USD',
                    customerEmail: document.getElementById('contactEmail').value
                })
            });

            const { orderId, error } = await response.json();
            if (error) throw new Error(error);

            // Render PayPal buttons
            await this.renderPayPalButtons(orderId, bookingData);

        } catch (error) {
            console.error('PayPal payment error:', error);
            throw error;
        }
    }

    async loadStripeJS() {
        return new Promise((resolve, reject) => {
            if (window.Stripe) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Stripe.js'));
            document.head.appendChild(script);
        });
    }

    async loadPayPalSDK() {
        return new Promise((resolve, reject) => {
            if (window.paypal) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://www.paypal.com/sdk/js?client-id=' + 
                       encodeURIComponent(window.PAYPAL_CLIENT_ID || 'sandbox-client-id') + 
                       '&currency=USD&intent=capture';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
            document.head.appendChild(script);
        });
    }

    async createStripeCardElement(stripe) {
        // Create a payment form if it doesn't exist
        if (!document.getElementById('stripe-card-element')) {
            const cardContainer = document.createElement('div');
            cardContainer.innerHTML = `
                <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin: 20px 0;">
                    <h4 style="margin: 0 0 16px 0; color: #333;">פרטי כרטיס אשראי</h4>
                    <div id="stripe-card-element" style="padding: 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff;"></div>
                    <div id="card-errors" style="color: #e74c3c; margin-top: 8px; font-size: 14px;"></div>
                </div>
            `;
            
            // Insert before payment buttons
            const paymentSection = document.querySelector('.payment-methods');
            paymentSection.appendChild(cardContainer);
        }

        const elements = stripe.elements();
        const cardElement = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                        color: '#aab7c4',
                    },
                },
            },
            hidePostalCode: true
        });

        cardElement.mount('#stripe-card-element');

        // Handle real-time validation errors
        cardElement.on('change', ({error}) => {
            const displayError = document.getElementById('card-errors');
            if (error) {
                displayError.textContent = error.message;
            } else {
                displayError.textContent = '';
            }
        });

        return cardElement;
    }

    async renderPayPalButtons(orderId, bookingData) {
        // Create PayPal button container if it doesn't exist
        if (!document.getElementById('paypal-button-container')) {
            const buttonContainer = document.createElement('div');
            buttonContainer.innerHTML = `
                <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin: 20px 0;">
                    <h4 style="margin: 0 0 16px 0; color: #333;">תשלום PayPal</h4>
                    <div id="paypal-button-container" style="max-width: 400px;"></div>
                </div>
            `;
            
            // Insert before payment buttons  
            const paymentSection = document.querySelector('.payment-methods');
            paymentSection.appendChild(buttonContainer);
        }

        return new Promise((resolve, reject) => {
            window.paypal.Buttons({
                createOrder: () => orderId,
                
                onApprove: async (data, actions) => {
                    try {
                        // Capture payment on server
                        const response = await fetch('/api/payments/capture-paypal-order', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                orderId: data.orderID,
                                bookingId: bookingData.bookingId
                            })
                        });

                        const result = await response.json();
                        if (result.success) {
                            this.showSuccessMessage(bookingData);
                            resolve(result);
                        } else {
                            throw new Error(result.error || 'Payment capture failed');
                        }
                    } catch (error) {
                        reject(error);
                    }
                },
                
                onError: (err) => {
                    console.error('PayPal error:', err);
                    reject(new Error('תשלום PayPal נכשל'));
                },
                
                onCancel: () => {
                    reject(new Error('תשלום בוטל על ידי המשתמש'));
                }
                
            }).render('#paypal-button-container');
        });
    }

    calculateTotalAmount() {
        const basePrice = this.currentFlight.price.amount || 500;
        const totalPassengers = this.passengers.length;
        const subtotal = basePrice * totalPassengers;
        const taxes = Math.round(subtotal * 0.15);
        return subtotal + taxes;
    }

    showSuccessMessage(bookingData) {
        const modal = document.getElementById('bookingModal');
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-container">
                <div class="success-content" style="text-align: center; padding: 60px 40px;">
                    <div style="font-size: 80px; margin-bottom: 20px;">✅</div>
                    <h2 style="color: #059669; margin-bottom: 16px;">ההזמנה הושלמה בהצלחה!</h2>
                    <p style="font-size: 18px; margin-bottom: 24px;">
                        קוד הזמנה: <strong>${bookingData.bookingId || 'BK' + Date.now()}</strong>
                    </p>
                    <p style="margin-bottom: 32px; color: #6b7280;">
                        פרטי ההזמנה נשלחו לאימייל שלכם<br>
                        תודה שבחרתם בנו! ✈️
                    </p>
                    <button class="btn btn-primary" onclick="document.getElementById('bookingModal').style.display='none'; document.body.style.overflow='auto'">
                        סגור
                    </button>
                </div>
            </div>
        `;
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('he-IL') + ' ' + 
               date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    }
}

// Initialize booking modal when page loads
let bookingModal;
document.addEventListener('DOMContentLoaded', function() {
    bookingModal = new BookingModal();
});

// Global function to open booking modal
function openBookingModal(flight) {
    if (bookingModal) {
        bookingModal.openModal(flight);
    }
}