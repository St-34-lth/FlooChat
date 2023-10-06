from celery import shared_task
from .models import *
from PIL import Image as img 
import io 
import os 
from django.core.files.uploadedfile import SimpleUploadedFile
# from django.db import connection
# connection.close()



#will probably need to make this into db transaction
@shared_task
def makeProfileImg(img_url):
    save_location = os.path.dirname(img_url)
    

    # record = User.objects.get(id=record_pk)
    # print(str(record.image.url)) 
    print(img_url)
    # print(record)
    image = img.open(img_url) 
    # print('in task')
    x_scale_factor = image.size[0]/100
    thumbnail = image.resize((100,int(image.size[1]/x_scale_factor)))
    thumbnail.save("test.jpg")
    byteArr = io.BytesIO()
    thumbnail.save(byteArr, format='jpeg')
    
    # file = SimpleUploadedFile("thumb_"+(img_url),byteArr.getvalue())
    thumb_filename = "thumb_" + os.path.basename(img_url)
    thumb_filepath = os.path.join(save_location, thumb_filename)

    # Save the thumbnail directly to the desired location
    thumbnail.save(thumb_filepath, format='JPEG')
    
    # result_path = makeProfileImg(img_url, save_location)
    print(f"Thumbnail saved at: {thumb_filepath}")
    # user.thumbnail = file
    # record.save()
    # user.save()

@shared_task 
def makeThumbnail(record_pk):
    record = Photo.objects.get(pk=record_pk)
    image = img.open('images/'+str(record.image))     
    x_scale_factor = image.size[0]/100
    thumbnail = image.resize((100,int(image.size[1]/x_scale_factor)))
    thumbnail.save("test.jpg")
    byteArr = io.BytesIO()
    thumbnail.save(byteArr, format='jpeg')
    file = SimpleUploadedFile("thumb_"+str(record.image),
    byteArr.getvalue())
    record.thumbnail = file
    record.save()