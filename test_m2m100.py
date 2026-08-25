import time
import torch

from transformers import (
    M2M100ForConditionalGeneration,
    M2M100Tokenizer,
)

MODEL_NAME = "facebook/m2m100_418M"

SOURCE_LANGUAGE = "ko"
TARGET_LANGUAGE = "es"

TEST_MESSAGES = [
    "안녕",
    "안녕하세요",
    "뭐해?",
    "밥 먹었어?",
    "ㅋㅋㅋ 진짜?",
    "10분 뒤에 갈게",
    "나 지금 광장 앞에 있는데 너희 어디 있어?",
    "조금 늦을 것 같아. 먼저 들어가 있어.",
]


print()
print("===================================")
print(" W Y D   T R A N S L A T E")
print(" M2M100 Korean → Spanish Test")
print("===================================")
print()

print("모델 불러오는 중...")
start = time.time()

tokenizer = M2M100Tokenizer.from_pretrained(
    MODEL_NAME
)

model = M2M100ForConditionalGeneration.from_pretrained(
    MODEL_NAME
)

model.eval()

print(
    f"모델 준비 완료: {time.time() - start:.1f}초"
)
print()


def translate(
    text: str,
    source_language: str,
    target_language: str,
):
    tokenizer.src_lang = source_language

    encoded = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
    )

    start_time = time.time()

    with torch.inference_mode():
        generated = model.generate(
            **encoded,
            forced_bos_token_id=tokenizer.get_lang_id(
                target_language
            ),
            max_new_tokens=128,
            num_beams=5,
        )

    translated = tokenizer.batch_decode(
        generated,
        skip_special_tokens=True,
    )[0]

    elapsed = time.time() - start_time

    return translated, elapsed


for index, text in enumerate(
    TEST_MESSAGES,
    start=1,
):
    try:
        translated, elapsed = translate(
            text,
            SOURCE_LANGUAGE,
            TARGET_LANGUAGE,
        )

        print(f"[{index}]")
        print(f"KO : {text}")
        print(f"ES : {translated}")
        print(f"TIME : {elapsed:.2f}s")
        print("-" * 45)

    except Exception as error:
        print(f"[{index}] ERROR")
        print(error)
        print("-" * 45)


print()
print("테스트 완료.")
