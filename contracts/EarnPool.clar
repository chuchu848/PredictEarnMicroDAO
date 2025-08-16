;; Predict-to-Earn MicroDAO
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; 

;; Data Variables
(define-map predictions
    uint
    {
        question: (string-utf8 128),
        end-block: uint,
        creator: principal,
    }
)
(define-map votes
    {
        prediction-id: uint,
        voter: principal,
    }
    bool
)
(define-map user-stats
    principal
    {
        predictions-created: uint,
        votes-cast: uint,
        correct-predictions: uint,
    }
)
(define-data-var prediction-counter uint u0)

;; Error Constants
(define-constant ERR-NOT-FOUND (err u101))
(define-constant ERR-PREDICTION-ENDED (err u102))
(define-constant ERR-INVALID-END-BLOCK (err u103))
(define-constant ERR-QUESTION-TOO-SHORT (err u104))

;; Public Functions
(define-public (create-prediction
        (question (string-utf8 128))
        (end-block uint)
    )
    (let (
            (id (var-get prediction-counter))
            (current-stats (default-to {
                predictions-created: u0,
                votes-cast: u0,
                correct-predictions: u0,
            }
                (map-get? user-stats tx-sender)
            ))
        )
        ;; Validate inputs
        (asserts! (> (len question) u0) ERR-QUESTION-TOO-SHORT)
        (asserts! (> end-block stacks-block-height) ERR-INVALID-END-BLOCK)

        ;; Store prediction
        (map-set predictions id {
            question: question,
            end-block: end-block,
            creator: tx-sender,
        })

        ;; Update user stats
        (map-set user-stats tx-sender
            (merge current-stats { predictions-created: (+ (get predictions-created current-stats) u1) })
        )

        ;; Increment counter
        (var-set prediction-counter (+ id u1))

        ;; Log event
        (print {
            event: "prediction-created",
            id: id,
            creator: tx-sender,
            question: question,
        })
        (ok id)
    )
)

(define-public (vote
        (prediction-id uint)
        (choice bool)
    )
    (let (
            (prediction (map-get? predictions prediction-id))
            (current-stats (default-to {
                predictions-created: u0,
                votes-cast: u0,
                correct-predictions: u0,
            }
                (map-get? user-stats tx-sender)
            ))
        )
        (match prediction
            prediction-data (begin
                ;; Check if prediction is still active
                (asserts!
                    (>= (get end-block prediction-data) stacks-block-height)
                    ERR-PREDICTION-ENDED
                )

                ;; Cast vote
                (map-set votes {
                    prediction-id: prediction-id,
                    voter: tx-sender,
                }
                    choice
                )

                ;; Update user stats
                (map-set user-stats tx-sender
                    (merge current-stats { votes-cast: (+ (get votes-cast current-stats) u1) })
                )

                ;; Log event
                (print {
                    event: "vote-cast",
                    prediction-id: prediction-id,
                    voter: tx-sender,
                    choice: choice,
                })
                (ok "Vote cast")
            )
            ERR-NOT-FOUND
        )
    )
)

;; Read-Only Functions (View Functions)
(define-read-only (get-prediction (id uint))
    (map-get? predictions id)
)

(define-read-only (get-vote
        (prediction-id uint)
        (voter principal)
    )
    (map-get? votes {
        prediction-id: prediction-id,
        voter: voter,
    })
)

(define-read-only (get-prediction-count)
    (var-get prediction-counter)
)

;; Prediction Status Check
(define-read-only (is-prediction-active (prediction-id uint))
    (match (map-get? predictions prediction-id)
        prediction-data (>= (get end-block prediction-data) stacks-block-height)
        false
    )
)

(define-read-only (get-prediction-status (prediction-id uint))
    (match (map-get? predictions prediction-id)
        prediction-data (if (>= (get end-block prediction-data) stacks-block-height)
            "active"
            "ended"
        )
        "not-found"
    )
)

;; Simple Reputation System
(define-read-only (get-user-stats (user principal))
    (default-to {
        predictions-created: u0,
        votes-cast: u0,
        correct-predictions: u0,
    }
        (map-get? user-stats user)
    )
)

(define-read-only (get-user-participation-score (user principal))
    (let ((stats (get-user-stats user)))
        (+ (get predictions-created stats) (get votes-cast stats))
    )
)

(define-read-only (get-user-accuracy-rate (user principal))
    (let ((stats (get-user-stats user)))
        (if (> (get votes-cast stats) u0)
            (/ (* (get correct-predictions stats) u100) (get votes-cast stats))
            u0
        )
    )
)

;; Helper function to update correct predictions (would be called by oracle or admin)
(define-public (update-correct-prediction (user principal))
    (let ((current-stats (get-user-stats user)))
        (begin
            (map-set user-stats user
                (merge current-stats { correct-predictions: (+ (get correct-predictions current-stats) u1) })
            )
            (ok "Correct prediction recorded")
        )
    )
)

;; Additional utility functions
(define-read-only (get-all-user-votes
        (user principal)
        (prediction-id uint)
    )
    (map-get? votes {
        prediction-id: prediction-id,
        voter: user,
    })
)

(define-read-only (has-user-voted
        (user principal)
        (prediction-id uint)
    )
    (is-some (map-get? votes {
        prediction-id: prediction-id,
        voter: user,
    }))
)
