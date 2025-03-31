document.addEventListener('DOMContentLoaded', function() {
    const timeLeftYearEl = document.getElementById('time-left-year');
    const weekendsLeftYearEl = document.getElementById('weekends-left-year');
    const birthdayInput = document.getElementById('birthday');
    const saveButton = document.getElementById('save-birthday');
    const birthdayStatusEl = document.getElementById('birthday-status');
    const lifeStatsEl = document.getElementById('life-stats');
    const weekendsLeftLifeEl = document.getElementById('weekends-left-life');
    const lifePercentLeftEl = document.getElementById('life-percent-left');

    const LIFESPAN_YEARS = 80;

    // --- Year Calculations ---

    function calculateTimeLeftYear() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999); // Dec 31st, 23:59:59.999

        const diffMs = endOfYear.getTime() - now.getTime();

        if (diffMs <= 0) {
             timeLeftYearEl.textContent = "Year ended!";
             return;
        }

        const seconds = Math.floor((diffMs / 1000) % 60);
        const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
        const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        timeLeftYearEl.innerHTML = `
            ${days} days<br>
            ${hours} hours<br>
            ${minutes} minutes<br>
            ${seconds} seconds
        `;
    }

    function calculateWeekendsLeftYear() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const endOfYear = new Date(currentYear, 11, 31); // Dec 31st
        let weekendCount = 0;
        let currentDate = new Date(now); // Start checking from today

        // Move to the next day if today is already checked or past
        // currentDate.setDate(currentDate.getDate() + 1); // Start checking from tomorrow

        while (currentDate <= endOfYear) {
            const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
            if (dayOfWeek === 6 || dayOfWeek === 0) { // Count Saturday and Sunday
                weekendCount++;
            }
             // Increment to the next day
             currentDate.setDate(currentDate.getDate() + 1);
        }
        // Divide by 2 because we counted both Saturday and Sunday individually
        weekendsLeftYearEl.textContent = Math.ceil(weekendCount / 2);
    }

    // --- Life Calculations ---

    function calculateLifeStats(birthdayString) {
        if (!birthdayString) {
            lifeStatsEl.style.display = 'none';
            return;
        }

        try {
            const now = new Date();
            const birthDate = new Date(birthdayString);
             // Add time zone offset to treat the date as local midnight
            birthDate.setMinutes(birthDate.getMinutes() + birthDate.getTimezoneOffset());

            if (isNaN(birthDate.getTime())) {
                throw new Error("Invalid birth date format.");
            }

            const endDate = new Date(birthDate);
            endDate.setFullYear(birthDate.getFullYear() + LIFESPAN_YEARS);

            // --- Weekends Left ---
            let lifeWeekendCount = 0;
            let currentDate = new Date(now); // Start from today

             if (currentDate >= endDate) { // Already past estimated end date
                 weekendsLeftLifeEl.textContent = "0";
             } else {
                while (currentDate < endDate) {
                    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
                    // We only count Saturdays to represent a full weekend unit remaining
                    if (dayOfWeek === 6) {
                        lifeWeekendCount++;
                    }
                    // Increment to the next day
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                weekendsLeftLifeEl.textContent = lifeWeekendCount;
             }


            // --- Percentage Left ---
            const totalLifespanMs = endDate.getTime() - birthDate.getTime();
            const timeLeftMs = endDate.getTime() - now.getTime();

            if (timeLeftMs <= 0 || totalLifespanMs <= 0) {
                 lifePercentLeftEl.textContent = "0.00%";
            } else {
                const percentageLeft = Math.max(0, (timeLeftMs / totalLifespanMs) * 100);
                lifePercentLeftEl.textContent = percentageLeft.toFixed(2) + "%";
            }

            lifeStatsEl.style.display = 'block'; // Show the stats section
            birthdayStatusEl.textContent = 'Birthday loaded.';
            birthdayStatusEl.className = 'status success';


        } catch (error) {
            console.error("Error calculating life stats:", error);
            lifeStatsEl.style.display = 'none';
            birthdayStatusEl.textContent = 'Error processing date.';
            birthdayStatusEl.className = 'status error';
        }
    }

    // --- Storage and Event Handling ---

    function saveBirthday() {
        const birthdayValue = birthdayInput.value;
        if (birthdayValue) {
            chrome.storage.local.set({ userBirthday: birthdayValue }, function() {
                console.log('Birthday saved:', birthdayValue);
                birthdayStatusEl.textContent = 'Birthday saved successfully!';
                birthdayStatusEl.className = 'status success';
                calculateLifeStats(birthdayValue); // Recalculate immediately
            });
        } else {
             birthdayStatusEl.textContent = 'Please select a valid date.';
             birthdayStatusEl.className = 'status error';
        }
    }

    function loadBirthdayAndCalculate() {
        chrome.storage.local.get(['userBirthday'], function(result) {
            if (result.userBirthday) {
                birthdayInput.value = result.userBirthday; // Set input field value
                calculateLifeStats(result.userBirthday);
            } else {
                lifeStatsEl.style.display = 'none'; // Hide if no birthday saved
                birthdayStatusEl.textContent = 'Enter your birthday to see life estimates.';
                birthdayStatusEl.className = 'status info';
            }
        });
    }

    // --- Initial Execution ---
    calculateTimeLeftYear(); // Calculate year time immediately
    calculateWeekendsLeftYear(); // Calculate year weekends immediately
    setInterval(calculateTimeLeftYear, 1000); // Update time every second

    loadBirthdayAndCalculate(); // Load saved birthday and calculate life stats

    saveButton.addEventListener('click', saveBirthday);
});
