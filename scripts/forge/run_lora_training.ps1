# run_lora_training.ps1
$DatasetDir = "c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\textures\avatars\custom\training_set"
$OutputDir = "c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\genX\lpc-lora"
$ScriptPath = "c:\Users\zakde\Desktop\AntiGravity projects\MyOS\scripts\forge\train_text_to_image_lora.py"

python -m accelerate.commands.launch $ScriptPath `
  --pretrained_model_name_or_path="c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.cache\huggingface\hub\models--runwayml--stable-diffusion-v1-5\snapshots\451f4fe16113bff5a5d2269ed5ad43b0592e9a14" `
  --train_data_dir=$DatasetDir `
  --dataloader_num_workers=0 `
  --resolution=512 `
  --center_crop `
  --train_batch_size=1 `
  --gradient_accumulation_steps=4 `
  --gradient_checkpointing `
  --max_train_steps=500 `
  --learning_rate=1e-04 `
  --max_grad_norm=1 `
  --lr_scheduler="cosine" `
  --lr_warmup_steps=0 `
  --output_dir=$OutputDir `
  --checkpointing_steps=250 `
  --seed=1337 `
  --mixed_precision="fp16" `
  --use_8bit_adam
