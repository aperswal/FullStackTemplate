#!/usr/bin/env bash
# AWS setup: get account ID, create IAM user, access keys, S3 bucket.

run_aws() {
  step "Setting up AWS"

  if is_step_done "aws"; then
    success "AWS already configured (skipping)"
    return 0
  fi

  if ! command -v aws &>/dev/null; then
    warn "AWS CLI not installed. Skipping AWS setup."
    warn "Install later with: brew install awscli"
    return 0
  fi

  # ─── Verify auth ────────────────────────────────────────────
  info "Checking AWS authentication..."
  local identity
  identity=$(aws sts get-caller-identity 2>/dev/null)

  if [ -z "$identity" ]; then
    warn "AWS CLI not authenticated."
    info "Run 'aws configure' to set up credentials, then re-run this script."
    return 0
  fi

  local account_id
  account_id=$(echo "$identity" | jq -r '.Account')
  env_set "AWS_ACCOUNT_ID" "$account_id"
  success "Authenticated as account $account_id"

  local region
  region=$(aws configure get region 2>/dev/null || echo "us-east-1")
  env_set "AWS_REGION" "$region"

  # ─── IAM User ───────────────────────────────────────────────
  local iam_user="fullstack-template-dev"
  info "Creating IAM user: $iam_user"

  if aws iam get-user --user-name "$iam_user" &>/dev/null; then
    success "IAM user $iam_user already exists"
  else
    aws iam create-user --user-name "$iam_user" >/dev/null 2>&1
    if [ $? -eq 0 ]; then
      success "Created IAM user: $iam_user"
    else
      error "Failed to create IAM user. You may not have IAM permissions."
      warn "Skipping IAM user creation. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY manually."
      mark_step_done "aws"
      return 0
    fi
  fi

  # ─── Access Keys ────────────────────────────────────────────
  local existing_key_id
  existing_key_id=$(state_get "AWS_ACCESS_KEY_ID")

  if [ -n "$existing_key_id" ]; then
    info "Reusing previously created access key: $existing_key_id"
    env_set "AWS_ACCESS_KEY_ID" "$existing_key_id"
    env_set "AWS_SECRET_ACCESS_KEY" "$(state_get 'AWS_SECRET_ACCESS_KEY')"
  else
    info "Creating access key for $iam_user..."
    local key_output
    key_output=$(aws iam create-access-key --user-name "$iam_user" 2>/dev/null)

    if [ -n "$key_output" ]; then
      local access_key_id secret_access_key
      access_key_id=$(echo "$key_output" | jq -r '.AccessKey.AccessKeyId')
      secret_access_key=$(echo "$key_output" | jq -r '.AccessKey.SecretAccessKey')

      env_set "AWS_ACCESS_KEY_ID" "$access_key_id"
      env_set "AWS_SECRET_ACCESS_KEY" "$secret_access_key"
      state_set "AWS_ACCESS_KEY_ID" "$access_key_id"
      state_set "AWS_SECRET_ACCESS_KEY" "$secret_access_key"
      success "Created access key: $access_key_id"
    else
      error "Failed to create access key."
      warn "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY manually in .env"
    fi
  fi

  # ─── S3 Bucket ──────────────────────────────────────────────
  local bucket_name="fullstack-template-uploads-dev"

  local existing_bucket
  existing_bucket=$(state_get "S3_BUCKET_NAME")
  if [ -n "$existing_bucket" ]; then
    bucket_name="$existing_bucket"
  fi

  bucket_name=$(prompt_value "S3 bucket name" "$bucket_name")

  info "Creating S3 bucket: $bucket_name"
  if aws s3api head-bucket --bucket "$bucket_name" 2>/dev/null; then
    success "Bucket $bucket_name already exists"
  else
    local create_args="--bucket $bucket_name"
    # us-east-1 doesn't use LocationConstraint
    if [ "$region" != "us-east-1" ]; then
      create_args="$create_args --create-bucket-configuration LocationConstraint=$region"
    fi

    if aws s3api create-bucket $create_args >/dev/null 2>&1; then
      success "Created bucket: $bucket_name"
    else
      error "Failed to create S3 bucket. It may already exist in another account."
      bucket_name=$(prompt_value "Enter an alternative bucket name" "${bucket_name}-$(openssl rand -hex 4)")
      aws s3api create-bucket --bucket "$bucket_name" >/dev/null 2>&1 || warn "Bucket creation failed. Set S3_BUCKET_NAME manually."
    fi
  fi

  env_set "S3_BUCKET_NAME" "$bucket_name"
  state_set "S3_BUCKET_NAME" "$bucket_name"

  # ─── S3 Policy for IAM User ────────────────────────────────
  info "Attaching S3 access policy..."
  local policy_doc
  policy_doc=$(cat <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::${bucket_name}",
        "arn:aws:s3:::${bucket_name}/*"
      ]
    }
  ]
}
POLICY
  )

  aws iam put-user-policy \
    --user-name "$iam_user" \
    --policy-name "fullstack-template-s3-access" \
    --policy-document "$policy_doc" >/dev/null 2>&1 \
    && success "Attached S3 policy to $iam_user" \
    || warn "Could not attach S3 policy. You may need to do this manually."

  mark_step_done "aws"
  success "AWS configured"
}
